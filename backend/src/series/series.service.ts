import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { mapPost } from '../utils/response.utils';
import { CreateSeriesDto } from './dto/create-series.dto';
import { UpdateSeriesDto } from './dto/update-series.dto';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const sharp = require('sharp') as typeof import('sharp');

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const AUTHOR_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  avatarShape: true,
  avatarFrame: true,
  badgeUrl: true,
} as const;

function postInclude(userId: string | null) {
  return {
    author: { select: AUTHOR_SELECT },
    _count: { select: { likes: true, comments: true, reposts: true } },
    ...(userId
      ? {
          likes: { where: { userId }, take: 1, select: { id: true } },
          bookmarks: { where: { userId }, take: 1, select: { id: true } },
          reposts: { where: { userId }, take: 1, select: { id: true } },
        }
      : {}),
  } as const;
}

const SERIES_PUBLIC_SELECT = {
  id: true,
  ownerId: true,
  name: true,
  slug: true,
  tagline: true,
  description: true,
  logoMimeType: true,
  wordmarkMimeType: true,
  coverMimeType: true,
  socialPreviewMimeType: true,
  coverBgColor: true,
  accentColor: true,
  bgColor: true,
  bgImageMimeType: true,
  coverFocalY: true,
  fontFamily: true,
  layoutMode: true,
  postListMode: true,
  showTopPosts: true,
  navLinks: true,
  pinnedPostIds: true,
  showTagline: true,
  visibility: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class SeriesService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // ─── Helpers ────────────────────────────────────────────────────────────────

  // New role hierarchy: OWNER(4) > CONTRIBUTOR(3) > EDITOR(2) > VIEWER(1)
  private readonly ROLE_RANK: Record<string, number> = { VIEWER: 1, EDITOR: 2, CONTRIBUTOR: 3, OWNER: 4 };

  private async assertMember(
    seriesId: string,
    userId: string,
    minRole: 'OWNER' | 'CONTRIBUTOR' | 'EDITOR' | 'VIEWER' = 'EDITOR',
  ) {
    const member = await this.prisma.seriesMember.findUnique({
      where: { seriesId_userId: { seriesId, userId } },
    });
    if (!member) throw new ForbiddenException('Not a member of this series');
    const rank = this.ROLE_RANK[member.role] ?? 0;
    if (rank < this.ROLE_RANK[minRole]) {
      throw new ForbiddenException(`Requires ${minRole} role or higher`);
    }
    return member;
  }

  private async getSeries(slug: string) {
    const s = await this.prisma.series.findUnique({ where: { slug } });
    if (!s) throw new NotFoundException('Series not found');
    return s;
  }

  private async getSeriesById(id: string) {
    const s = await this.prisma.series.findUnique({ where: { id } });
    if (!s) throw new NotFoundException('Series not found');
    return s;
  }

  // ─── CRUD ───────────────────────────────────────────────────────────────────

  async create(userId: string, dto: CreateSeriesDto) {
    const base = dto.slug ? slugify(dto.slug) : slugify(dto.name);
    let slug = base;
    let attempt = 0;
    while (await this.prisma.series.findUnique({ where: { slug } })) {
      attempt++;
      slug = `${base}-${attempt}`;
    }

    const series = await this.prisma.series.create({
      data: {
        ownerId: userId,
        name: dto.name,
        slug,
        tagline: dto.tagline ?? null,
        description: dto.description ?? null,
        visibility: (dto.visibility as any) ?? 'PUBLIC',
        members: {
          create: { userId, role: 'OWNER' },
        },
      },
      select: SERIES_PUBLIC_SELECT,
    });

    return { ...series, _count: { followers: 0, posts: 0 }, isFollowing: false, isMember: true, memberRole: 'OWNER' };
  }

  async findAll(viewerUserId: string | null, limit = 20, offset = 0, search?: string) {
    const where: any = {
      visibility: 'PUBLIC',
      ...(search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { tagline: { contains: search, mode: 'insensitive' } }] } : {}),
    };

    const [series, total] = await Promise.all([
      this.prisma.series.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          ...SERIES_PUBLIC_SELECT,
          owner: { select: AUTHOR_SELECT },
          _count: { select: { follows: true, posts: true } },
          ...(viewerUserId
            ? { follows: { where: { userId: viewerUserId }, take: 1, select: { id: true } } }
            : {}),
        },
      }),
      this.prisma.series.count({ where }),
    ]);

    return {
      series: series.map((s) => this.mapSeriesPublic(s, viewerUserId)),
      total,
    };
  }

  async findMine(userId: string) {
    const memberships = await this.prisma.seriesMember.findMany({
      where: { userId },
      include: {
        series: {
          select: {
            ...SERIES_PUBLIC_SELECT,
            _count: { select: { follows: true, posts: true } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships.map((m) => ({
      ...this.mapSeriesPublic(m.series, userId),
      memberRole: m.role,
    }));
  }

  async findByUser(username: string, viewerUserId: string | null) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) throw new NotFoundException('User not found');

    const memberships = await this.prisma.seriesMember.findMany({
      where: {
        userId: user.id,
        // Only expose public series to outside viewers
        ...(viewerUserId === user.id
          ? {}
          : { series: { visibility: 'PUBLIC' } }),
      },
      include: {
        series: {
          select: {
            ...SERIES_PUBLIC_SELECT,
            _count: { select: { follows: true, posts: true } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships.map((m) => ({
      ...this.mapSeriesPublic(m.series, viewerUserId),
      memberRole: m.role,
    }));
  }

  async findOne(slug: string, viewerUserId: string | null) {
    const s = await this.prisma.series.findUnique({
      where: { slug },
      select: {
        ...SERIES_PUBLIC_SELECT,
        owner: { select: AUTHOR_SELECT },
        _count: { select: { follows: true, posts: true } },
        members: {
          select: {
            role: true,
            joinedAt: true,
            user: { select: AUTHOR_SELECT },
          },
        },
        ...(viewerUserId
          ? { follows: { where: { userId: viewerUserId }, take: 1, select: { id: true } } }
          : {}),
      },
    });
    if (!s) throw new NotFoundException('Series not found');

    // Check visibility
    if (s.visibility === 'PRIVATE') {
      if (!viewerUserId) throw new ForbiddenException('This series is private');
      const member = await this.prisma.seriesMember.findUnique({
        where: { seriesId_userId: { seriesId: s.id, userId: viewerUserId } },
      });
      if (!member) throw new ForbiddenException('This series is private');
    }
    if (s.visibility === 'FOLLOWERS_ONLY' && viewerUserId !== s.ownerId) {
      if (viewerUserId) {
        const follow = await this.prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: viewerUserId, followingId: s.ownerId } },
        });
        if (!follow) throw new ForbiddenException('This series is for followers only');
      } else {
        throw new ForbiddenException('This series is for followers only');
      }
    }

    const memberRecord = viewerUserId
      ? s.members.find((m) => m.user.id === viewerUserId)
      : null;

    return {
      ...this.mapSeriesPublic(s, viewerUserId),
      owner: s.owner,
      members: s.members,
      isMember: !!memberRecord,
      memberRole: memberRecord?.role ?? null,
    };
  }

  async update(slug: string, userId: string, dto: UpdateSeriesDto) {
    const s = await this.getSeries(slug);
    await this.assertMember(s.id, userId, 'CONTRIBUTOR');

    if (dto.slug !== undefined) {
      const newSlug = slugify(dto.slug);
      const existing = await this.prisma.series.findFirst({
        where: { slug: newSlug, id: { not: s.id } },
      });
      if (existing) throw new BadRequestException('Slug already in use');
      dto.slug = newSlug;
    }

    return this.prisma.series.update({
      where: { id: s.id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.tagline !== undefined && { tagline: dto.tagline }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.visibility !== undefined && { visibility: dto.visibility as any }),
        ...(dto.coverBgColor !== undefined && { coverBgColor: dto.coverBgColor }),
        ...(dto.accentColor !== undefined && { accentColor: dto.accentColor }),
        ...(dto.bgColor !== undefined && { bgColor: dto.bgColor }),
        ...(dto.coverFocalY !== undefined && { coverFocalY: dto.coverFocalY }),
        ...(dto.fontFamily !== undefined && { fontFamily: dto.fontFamily }),
        ...(dto.layoutMode !== undefined && { layoutMode: dto.layoutMode }),
        ...(dto.postListMode !== undefined && { postListMode: dto.postListMode }),
        ...(dto.showTopPosts !== undefined && { showTopPosts: dto.showTopPosts }),
        ...(dto.showTagline !== undefined && { showTagline: dto.showTagline }),
        ...(dto.navLinks !== undefined && { navLinks: dto.navLinks === null ? Prisma.JsonNull : dto.navLinks }),
        ...(dto.pinnedPostIds !== undefined && { pinnedPostIds: dto.pinnedPostIds }),
      },
      select: SERIES_PUBLIC_SELECT,
    });
  }

  async remove(slug: string, userId: string) {
    const s = await this.getSeries(slug);
    await this.assertMember(s.id, userId, 'OWNER');
    await this.prisma.series.delete({ where: { id: s.id } });
    return { deleted: true };
  }

  // ─── Images ─────────────────────────────────────────────────────────────────

  async uploadImage(
    slug: string,
    userId: string,
    type: 'logo' | 'wordmark' | 'cover' | 'social-preview' | 'bg-image',
    buffer: Buffer,
    mimeType: string,
  ) {
    const s = await this.getSeries(slug);
    await this.assertMember(s.id, userId, 'EDITOR');

    const MAX = 15 * 1024 * 1024; // 15 MB for bg images (GIFs can be large)
    if (buffer.length > MAX) throw new BadRequestException('Image too large (max 15MB)');

    let processed: Buffer;
    // Skip sharp for GIFs (it strips animation) and bg-images (keep full quality/animation)
    const isGif = mimeType === 'image/gif';
    if (isGif || type === 'bg-image') {
      processed = buffer;
    } else {
      try {
        let pipeline = sharp(buffer);
        if (type === 'logo') {
          pipeline = pipeline.resize(512, 512, { fit: 'inside', withoutEnlargement: true });
        } else if (type === 'cover' || type === 'social-preview') {
          pipeline = pipeline.resize(1200, null, { fit: 'inside', withoutEnlargement: true });
        } else if (type === 'wordmark') {
          pipeline = pipeline.resize(840, 160, { fit: 'inside', withoutEnlargement: true });
        }
        processed = await pipeline.toBuffer();
      } catch {
        processed = buffer;
      }
    }

    const fieldMap = {
      logo: { data: 'logoData', mime: 'logoMimeType' },
      wordmark: { data: 'wordmarkData', mime: 'wordmarkMimeType' },
      cover: { data: 'coverData', mime: 'coverMimeType' },
      'social-preview': { data: 'socialPreviewData', mime: 'socialPreviewMimeType' },
      'bg-image': { data: 'bgImageData', mime: 'bgImageMimeType' },
    } as const;
    const { data, mime } = fieldMap[type];

    await this.prisma.series.update({
      where: { id: s.id },
      data: { [data]: processed, [mime]: mimeType },
    });
    return { updated: true };
  }

  async getImage(slug: string, type: 'logo' | 'wordmark' | 'cover' | 'social-preview' | 'bg-image') {
    const s = await this.prisma.series.findUnique({
      where: { slug },
      select: {
        logoData: true, logoMimeType: true,
        wordmarkData: true, wordmarkMimeType: true,
        coverData: true, coverMimeType: true,
        socialPreviewData: true, socialPreviewMimeType: true,
        bgImageData: true, bgImageMimeType: true,
      },
    });
    if (!s) throw new NotFoundException('Series not found');

    const fieldMap = {
      logo: { data: s.logoData, mime: s.logoMimeType },
      wordmark: { data: s.wordmarkData, mime: s.wordmarkMimeType },
      cover: { data: s.coverData, mime: s.coverMimeType },
      'social-preview': { data: s.socialPreviewData, mime: s.socialPreviewMimeType },
      'bg-image': { data: s.bgImageData, mime: s.bgImageMimeType },
    };
    const { data, mime } = fieldMap[type];
    if (!data) throw new NotFoundException('Image not found');
    return { data, mime: mime ?? 'image/jpeg' };
  }

  async deleteImage(slug: string, userId: string, type: 'logo' | 'wordmark' | 'cover' | 'social-preview' | 'bg-image') {
    const s = await this.getSeries(slug);
    await this.assertMember(s.id, userId, 'EDITOR');

    const fieldMap = {
      logo: { data: 'logoData', mime: 'logoMimeType' },
      wordmark: { data: 'wordmarkData', mime: 'wordmarkMimeType' },
      cover: { data: 'coverData', mime: 'coverMimeType' },
      'social-preview': { data: 'socialPreviewData', mime: 'socialPreviewMimeType' },
      'bg-image': { data: 'bgImageData', mime: 'bgImageMimeType' },
    } as const;
    const { data, mime } = fieldMap[type];

    await this.prisma.series.update({
      where: { id: s.id },
      data: { [data]: null, [mime]: null },
    });
    return { deleted: true };
  }

  // ─── Members ─────────────────────────────────────────────────────────────────

  async getMembers(slug: string, viewerUserId: string | null) {
    const s = await this.getSeries(slug);
    return this.prisma.seriesMember.findMany({
      where: { seriesId: s.id },
      include: { user: { select: AUTHOR_SELECT } },
      orderBy: { joinedAt: 'asc' },
    });
  }

  async inviteByUsername(slug: string, inviterId: string, username: string, inviteRole: string = 'EDITOR') {
    const s = await this.getSeries(slug);
    const inviter = await this.assertMember(s.id, inviterId, 'CONTRIBUTOR');

    // Validate the requested role and check inviter's permission to grant it
    const allowedRoles = ['EDITOR', 'CONTRIBUTOR', 'VIEWER'];
    if (!allowedRoles.includes(inviteRole)) throw new BadRequestException('Invalid role');

    // VIEWER role only available for PRIVATE series
    if (inviteRole === 'VIEWER' && (s as any).visibility !== 'PRIVATE') {
      throw new BadRequestException('Viewer role is only available for private series');
    }
    // Only OWNER can invite as CONTRIBUTOR; CONTRIBUTORs can only invite as EDITOR or VIEWER
    if (inviteRole === 'CONTRIBUTOR' && inviter.role !== 'OWNER') {
      throw new ForbiddenException('Only the owner can invite contributors');
    }

    const target = await this.prisma.user.findUnique({ where: { username } });
    if (!target) throw new NotFoundException('User not found');

    const existing = await this.prisma.seriesMember.findUnique({
      where: { seriesId_userId: { seriesId: s.id, userId: target.id } },
    });
    if (existing) throw new ConflictException('User is already a member');

    const token = randomBytes(24).toString('hex');
    await this.prisma.seriesInviteToken.create({
      data: { seriesId: s.id, token, role: inviteRole, createdById: inviterId, targetUserId: target.id },
    });

    await this.notifications.create({
      userId: target.id,
      type: 'SERIES_INVITE',
      actorId: inviterId,
      seriesId: s.id,
      inviteToken: token,
    });

    return { invitedUsername: username };
  }

  async acceptInvite(token: string, userId: string) {
    const invite = await this.prisma.seriesInviteToken.findUnique({
      where: { token },
      include: { series: { select: { id: true, slug: true, name: true, ownerId: true } } },
    });
    if (!invite) throw new NotFoundException('Invalid invite token');
    if (invite.targetUserId && invite.targetUserId !== userId) {
      throw new ForbiddenException('This invite is not for you');
    }

    const existing = await this.prisma.seriesMember.findUnique({
      where: { seriesId_userId: { seriesId: invite.seriesId, userId } },
    });
    if (!existing) {
      await this.prisma.seriesMember.create({
        data: { seriesId: invite.seriesId, userId, role: invite.role as any },
      });
    }

    await this.prisma.seriesInviteToken.delete({ where: { token } });

    await this.notifications.create({
      userId: invite.series.ownerId,
      type: 'SERIES_INVITE_ACCEPTED',
      actorId: userId,
      seriesId: invite.series.id,
    });

    return { accepted: true, series: invite.series, role: invite.role };
  }

  async rejectInvite(token: string, userId: string) {
    const invite = await this.prisma.seriesInviteToken.findUnique({
      where: { token },
      include: { series: { select: { id: true, slug: true, name: true, ownerId: true } } },
    });
    if (!invite) throw new NotFoundException('Invalid invite token');
    if (invite.targetUserId && invite.targetUserId !== userId) {
      throw new ForbiddenException('This invite is not for you');
    }

    await this.prisma.seriesInviteToken.delete({ where: { token } });

    // Notify the series owner
    await this.notifications.create({
      userId: invite.series.ownerId,
      type: 'SERIES_INVITE_REJECTED',
      actorId: userId,
      seriesId: invite.series.id,
    });

    return { rejected: true };
  }

  async getOrCreateInviteLink(slug: string, userId: string, linkRole: string = 'EDITOR') {
    const s = await this.getSeries(slug);
    const member = await this.assertMember(s.id, userId, 'CONTRIBUTOR');

    const allowedRoles = ['EDITOR', 'CONTRIBUTOR', 'VIEWER'];
    if (!allowedRoles.includes(linkRole)) throw new BadRequestException('Invalid role');
    if (linkRole === 'VIEWER' && (s as any).visibility !== 'PRIVATE') {
      throw new BadRequestException('Viewer role is only available for private series');
    }
    if (linkRole === 'CONTRIBUTOR' && member.role !== 'OWNER') {
      throw new ForbiddenException('Only the owner can generate contributor invite links');
    }

    // Reuse existing non-expired token for the same role
    const existing = await this.prisma.seriesInviteToken.findFirst({
      where: { seriesId: s.id, createdById: userId, role: linkRole, expiresAt: null, targetUserId: null },
      orderBy: { createdAt: 'desc' },
    });
    if (existing) return { token: existing.token, role: linkRole };

    const token = randomBytes(24).toString('hex');
    await this.prisma.seriesInviteToken.create({
      data: { seriesId: s.id, token, role: linkRole, createdById: userId },
    });
    return { token, role: linkRole };
  }

  async previewInviteLink(token: string) {
    const invite = await this.prisma.seriesInviteToken.findUnique({
      where: { token },
      include: {
        series: { select: { id: true, name: true, slug: true, logoMimeType: true } },
        createdBy: { select: { id: true, username: true, displayName: true } },
      },
    });
    if (!invite) throw new NotFoundException('Invalid or expired invite link');
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      throw new BadRequestException('This invite link has expired');
    }
    return {
      series: invite.series,
      inviter: invite.createdBy,
      role: invite.role,
    };
  }

  async joinViaToken(token: string, userId: string) {
    const invite = await this.prisma.seriesInviteToken.findUnique({
      where: { token },
      include: { series: { select: { id: true, slug: true, name: true, ownerId: true } } },
    });
    if (!invite) throw new NotFoundException('Invalid or expired invite link');
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      throw new BadRequestException('This invite link has expired');
    }

    const existing = await this.prisma.seriesMember.findUnique({
      where: { seriesId_userId: { seriesId: invite.seriesId, userId } },
    });
    if (existing) throw new ConflictException('Already a member');

    await this.prisma.seriesMember.create({
      data: { seriesId: invite.seriesId, userId, role: invite.role as any },
    });

    // Single-use: delete the token after acceptance
    await this.prisma.seriesInviteToken.delete({ where: { token } });

    // Notify the series owner
    await this.notifications.create({
      userId: invite.series.ownerId,
      type: 'SERIES_INVITE_ACCEPTED',
      actorId: userId,
      seriesId: invite.series.id,
    });

    return { joined: true, series: invite.series };
  }

  async declineInviteLink(token: string, userId: string) {
    const invite = await this.prisma.seriesInviteToken.findUnique({
      where: { token },
      include: { series: { select: { id: true, slug: true, name: true, ownerId: true } } },
    });
    if (!invite) throw new NotFoundException('Invalid or expired invite link');

    // Delete the token so the same link cannot be used again
    await this.prisma.seriesInviteToken.delete({ where: { token } });

    // Notify the series owner
    await this.notifications.create({
      userId: invite.series.ownerId,
      type: 'SERIES_INVITE_REJECTED',
      actorId: userId,
      seriesId: invite.series.id,
    });

    return { declined: true };
  }

  async updateMemberRole(slug: string, ownerId: string, targetUserId: string, role: 'EDITOR' | 'CONTRIBUTOR' | 'VIEWER') {
    const s = await this.getSeries(slug);
    await this.assertMember(s.id, ownerId, 'OWNER');
    if (targetUserId === ownerId) throw new BadRequestException('Cannot change owner role');
    if (role === 'VIEWER' && (s as any).visibility !== 'PRIVATE') {
      throw new BadRequestException('Viewer role is only available for private series');
    }

    const member = await this.prisma.seriesMember.findUnique({
      where: { seriesId_userId: { seriesId: s.id, userId: targetUserId } },
    });
    if (!member) throw new NotFoundException('Member not found');

    return this.prisma.seriesMember.update({
      where: { seriesId_userId: { seriesId: s.id, userId: targetUserId } },
      data: { role: role as any },
      include: { user: { select: AUTHOR_SELECT } },
    });
  }

  async removeMember(slug: string, requesterId: string, targetUserId: string) {
    const s = await this.getSeries(slug);
    // Owner can remove anyone; user can remove themselves
    if (requesterId !== targetUserId) {
      await this.assertMember(s.id, requesterId, 'OWNER');
    }
    if (targetUserId === s.ownerId) throw new BadRequestException('Cannot remove the owner');

    await this.prisma.seriesMember.deleteMany({
      where: { seriesId: s.id, userId: targetUserId },
    });
    return { removed: true };
  }

  // ─── Posts ───────────────────────────────────────────────────────────────────

  async getPosts(slug: string, viewerUserId: string | null, limit = 50, offset = 0) {
    const s = await this.getSeries(slug);

    // For PRIVATE series, only members (any role) can see posts
    if ((s as any).visibility === 'PRIVATE') {
      if (!viewerUserId) throw new ForbiddenException('This series is private');
      const membership = await this.prisma.seriesMember.findUnique({
        where: { seriesId_userId: { seriesId: s.id, userId: viewerUserId } },
      });
      if (!membership) throw new ForbiddenException('This series is private');
    }

    // For PRIVATE series, all approved posts are visible (viewer must be a member to reach this point).
    // For PUBLIC/FOLLOWERS_ONLY series, additionally filter by post-level visibility:
    //   - If viewer follows the series OR is a member → show all (PUBLIC + FOLLOWERS_ONLY)
    //   - Otherwise → show only PUBLIC posts
    let postVisibilityWhere: any = {};
    if ((s as any).visibility !== 'PRIVATE') {
      let canSeeFollowersOnlyPosts = false;
      if (viewerUserId) {
        const [follow, member] = await Promise.all([
          this.prisma.seriesFollow.findUnique({
            where: { seriesId_userId: { seriesId: s.id, userId: viewerUserId } },
          }),
          this.prisma.seriesMember.findUnique({
            where: { seriesId_userId: { seriesId: s.id, userId: viewerUserId } },
          }),
        ]);
        canSeeFollowersOnlyPosts = !!(follow || member);
      }
      if (!canSeeFollowersOnlyPosts) {
        postVisibilityWhere = { postVisibility: 'PUBLIC' };
      }
    }

    const seriesPosts = await this.prisma.seriesPost.findMany({
      where: { seriesId: s.id, status: 'APPROVED', ...postVisibilityWhere },
      orderBy: { order: 'asc' },
      take: limit,
      skip: offset,
      include: { post: { include: postInclude(viewerUserId) } },
    });

    return seriesPosts.map((sp) => ({
      ...mapPost(sp.post as any, viewerUserId),
      seriesOrder: sp.order,
      seriesStatus: sp.status,
      postVisibility: (sp as any).postVisibility,
      series: { id: s.id, name: s.name, slug: s.slug, logoMimeType: s.logoMimeType, accentColor: s.accentColor },
    }));
  }

  async getPendingPosts(slug: string, requesterId: string) {
    const s = await this.getSeries(slug);
    await this.assertMember(s.id, requesterId, 'CONTRIBUTOR');

    const seriesPosts = await this.prisma.seriesPost.findMany({
      where: { seriesId: s.id, status: 'PENDING' },
      orderBy: { addedAt: 'asc' },
      include: { post: { include: postInclude(requesterId) } },
    });

    return seriesPosts.map((sp) => ({
      ...mapPost(sp.post as any, requesterId),
      seriesOrder: sp.order,
      seriesStatus: sp.status,
      series: { id: s.id, name: s.name, slug: s.slug, logoMimeType: s.logoMimeType, accentColor: s.accentColor },
    }));
  }

  async addPost(slug: string, userId: string, postId: string, postVisibility = 'PUBLIC') {
    const s = await this.getSeries(slug);
    // Only EDITOR+ can add posts; VIEWERs cannot
    const member = await this.assertMember(s.id, userId, 'EDITOR');

    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    // Editors can only add their own posts
    if (post.authorId !== userId && member.role === 'EDITOR') {
      throw new ForbiddenException('Editors can only add their own posts');
    }

    const existing = await this.prisma.seriesPost.findUnique({
      where: { seriesId_postId: { seriesId: s.id, postId } },
    });
    if (existing) throw new ConflictException('Post already in series');

    const maxOrder = await this.prisma.seriesPost.aggregate({
      where: { seriesId: s.id },
      _max: { order: true },
    });
    const order = (maxOrder._max.order ?? -1) + 1;

    // Editors submit for owner/contributor approval; contributors/owners go directly to series
    const status = member.role === 'EDITOR' ? 'PENDING' : 'APPROVED';
    const resolvedVisibility = (s as any).visibility === 'PRIVATE' ? 'PUBLIC' : postVisibility;

    const sp = await this.prisma.seriesPost.create({
      data: { seriesId: s.id, postId, order, status, postVisibility: resolvedVisibility },
    });

    // Notify the series owner when an editor submits a post for review
    if (status === 'PENDING' && s.ownerId !== userId) {
      await this.notifications.create({
        userId: s.ownerId,
        type: 'SERIES_POST_SUBMITTED',
        actorId: userId,
        seriesId: s.id,
        postId,
      });
    }

    return { added: true, status: sp.status };
  }

  async removePost(slug: string, userId: string, postId: string) {
    const s = await this.getSeries(slug);
    const member = await this.assertMember(s.id, userId, 'CONTRIBUTOR');

    if (member.role === 'OWNER') {
      // Owner deletes immediately
      await this.prisma.seriesPost.deleteMany({ where: { seriesId: s.id, postId } });
      return { removed: true, immediate: true };
    }

    // Contributor: request deletion (hides the post, owner reviews in admin panel)
    const sp = await this.prisma.seriesPost.findUnique({
      where: { seriesId_postId: { seriesId: s.id, postId } },
    });
    if (!sp) throw new NotFoundException('Post not in series');

    await this.prisma.seriesPost.update({
      where: { seriesId_postId: { seriesId: s.id, postId } },
      data: { status: 'DELETION_PENDING' },
    });

    // Notify the owner about the deletion request
    if (s.ownerId !== userId) {
      await this.notifications.create({
        userId: s.ownerId,
        type: 'SERIES_POST_SUBMITTED' as any,
        actorId: userId,
        seriesId: s.id,
        postId,
      } as any);
    }

    return { removed: false, pending: true };
  }

  async getPendingDeletions(slug: string, requesterId: string) {
    const s = await this.getSeries(slug);
    await this.assertMember(s.id, requesterId, 'OWNER');

    const seriesPosts = await this.prisma.seriesPost.findMany({
      where: { seriesId: s.id, status: 'DELETION_PENDING' },
      orderBy: { addedAt: 'asc' },
      include: { post: { include: postInclude(requesterId) } },
    });

    return seriesPosts.map((sp) => ({
      ...mapPost(sp.post as any, requesterId),
      seriesOrder: sp.order,
      seriesStatus: sp.status,
      series: { id: s.id, name: s.name, slug: s.slug, logoMimeType: s.logoMimeType, accentColor: s.accentColor },
    }));
  }

  async approveDeletion(slug: string, userId: string, postId: string) {
    const s = await this.getSeries(slug);
    await this.assertMember(s.id, userId, 'OWNER');
    const sp = await this.prisma.seriesPost.findUnique({
      where: { seriesId_postId: { seriesId: s.id, postId } },
    });
    if (!sp || sp.status !== 'DELETION_PENDING') throw new NotFoundException('No pending deletion for this post');
    await this.prisma.seriesPost.delete({ where: { seriesId_postId: { seriesId: s.id, postId } } });
    return { deleted: true };
  }

  async rejectDeletion(slug: string, userId: string, postId: string) {
    const s = await this.getSeries(slug);
    await this.assertMember(s.id, userId, 'OWNER');
    const sp = await this.prisma.seriesPost.findUnique({
      where: { seriesId_postId: { seriesId: s.id, postId } },
    });
    if (!sp || sp.status !== 'DELETION_PENDING') throw new NotFoundException('No pending deletion for this post');
    await this.prisma.seriesPost.update({
      where: { seriesId_postId: { seriesId: s.id, postId } },
      data: { status: 'APPROVED' },
    });
    return { restored: true };
  }

  async approvePost(slug: string, userId: string, postId: string) {
    const s = await this.getSeries(slug);
    await this.assertMember(s.id, userId, 'CONTRIBUTOR');

    const sp = await this.prisma.seriesPost.findUnique({
      where: { seriesId_postId: { seriesId: s.id, postId } },
      include: { post: { select: { authorId: true } } },
    });
    if (!sp) throw new NotFoundException('Post not in series');

    const updated = await this.prisma.seriesPost.update({
      where: { seriesId_postId: { seriesId: s.id, postId } },
      data: { status: 'APPROVED' },
    });

    // Only notify if the approver is different from the author
    if (sp.post.authorId !== userId) {
      await this.notifications.create({
        userId: sp.post.authorId,
        type: 'SERIES_POST_APPROVED',
        actorId: userId,
        postId,
        seriesId: s.id,
      });
    }

    return updated;
  }

  async rejectPost(slug: string, userId: string, postId: string) {
    const s = await this.getSeries(slug);
    await this.assertMember(s.id, userId, 'CONTRIBUTOR');
    const sp = await this.prisma.seriesPost.findUnique({
      where: { seriesId_postId: { seriesId: s.id, postId } },
      include: { post: { select: { authorId: true } } },
    });
    if (!sp) throw new NotFoundException('Post not in series');
    await this.prisma.seriesPost.delete({ where: { seriesId_postId: { seriesId: s.id, postId } } });

    // Notify the contributor that their post was rejected
    if (sp.post.authorId !== userId) {
      await this.notifications.create({
        userId: sp.post.authorId,
        type: 'SERIES_POST_REJECTED',
        actorId: userId,
        postId,
        seriesId: s.id,
      });
    }

    return { rejected: true };
  }

  async reorderPosts(slug: string, userId: string, orderedPostIds: string[]) {
    const s = await this.getSeries(slug);
    await this.assertMember(s.id, userId, 'CONTRIBUTOR');

    await Promise.all(
      orderedPostIds.map((postId, idx) =>
        this.prisma.seriesPost.updateMany({
          where: { seriesId: s.id, postId },
          data: { order: idx },
        }),
      ),
    );
    return { reordered: true };
  }

  // ─── Follow ──────────────────────────────────────────────────────────────────

  async follow(slug: string, userId: string) {
    const s = await this.getSeries(slug);
    await this.prisma.seriesFollow.upsert({
      where: { seriesId_userId: { seriesId: s.id, userId } },
      create: { seriesId: s.id, userId },
      update: {},
    });

    // Notify series owner
    if (s.ownerId !== userId) {
      await this.notifications.create({
        userId: s.ownerId,
        type: 'SERIES_FOLLOW' as any,
        actorId: userId,
        seriesId: s.id,
      } as any);
    }
    return { following: true };
  }

  async unfollow(slug: string, userId: string) {
    const s = await this.getSeries(slug);
    await this.prisma.seriesFollow.deleteMany({ where: { seriesId: s.id, userId } });
    return { following: false };
  }

  async getFollowers(slug: string, limit = 20, offset = 0) {
    const s = await this.getSeries(slug);

    // Exclude users who are already members — they own/contribute to the series
    const memberIds = (
      await this.prisma.seriesMember.findMany({
        where: { seriesId: s.id },
        select: { userId: true },
      })
    ).map((m) => m.userId);

    const where = {
      seriesId: s.id,
      ...(memberIds.length ? { userId: { notIn: memberIds } } : {}),
    };

    const [followers, total] = await Promise.all([
      this.prisma.seriesFollow.findMany({
        where,
        take: limit,
        skip: offset,
        include: { user: { select: AUTHOR_SELECT } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.seriesFollow.count({ where }),
    ]);
    return { followers: followers.map((f) => f.user), total };
  }

  // ─── Analytics ───────────────────────────────────────────────────────────────

  async getAnalytics(slug: string, userId: string) {
    const s = await this.getSeries(slug);
    await this.assertMember(s.id, userId, 'CONTRIBUTOR');

    const [followerCount, seriesPosts] = await Promise.all([
      this.prisma.seriesFollow.count({ where: { seriesId: s.id } }),
      this.prisma.seriesPost.findMany({
        where: { seriesId: s.id, status: 'APPROVED' },
        include: { post: { select: { viewCount: true, title: true, id: true, _count: { select: { likes: true, comments: true } } } } },
        orderBy: { order: 'asc' },
      }),
    ]);

    const totalViews = seriesPosts.reduce((acc, sp) => acc + (sp.post.viewCount ?? 0), 0);
    const totalPosts = seriesPosts.length;

    const topPosts = [...seriesPosts]
      .sort((a, b) => (b.post.viewCount ?? 0) - (a.post.viewCount ?? 0))
      .slice(0, 5)
      .map((sp) => ({ id: sp.post.id, title: sp.post.title, views: sp.post.viewCount }));

    return { totalViews, totalPosts, followerCount, topPosts };
  }

  // ─── Map helper ─────────────────────────────────────────────────────────────

  private mapSeriesPublic(s: any, viewerUserId: string | null) {
    const isFollowing = Array.isArray(s.follows) ? s.follows.length > 0 : false;
    const { follows, ...rest } = s;
    return {
      ...rest,
      followerCount: s._count?.follows ?? 0,
      postCount: s._count?.posts ?? 0,
      isFollowing,
    };
  }
}
