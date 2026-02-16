import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const sharp = require('sharp') as typeof import('sharp');
import type { SharpOptions } from 'sharp';
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const DOMPurify = require('isomorphic-dompurify') as { sanitize: (html: string, options?: object) => string };
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from '../auth/dto/register.dto';
import { UpdateProfileDto, PRIVACY_VISIBILITY, WHO_CAN_FOLLOW_ME } from './dto/update-profile.dto';

const MAX_AVATAR_FRAME_BYTES = 2048;

/** Max upload size for custom badge (100 KB). Favicon-like small transparent icons. */
const MAX_BADGE_SIZE = 100 * 1024;
const BADGE_TARGET_SIZE = 64;
const BADGE_MIME = 'image/png';

/** Sanitize avatarFrame object: only allowed keys, reasonable values. Returns undefined if invalid. */
function sanitizeAvatarFrame(
  raw: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null | undefined {
  if (raw === null || raw === undefined) return raw;
  if (typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const out: Record<string, unknown> = {};
  const allowed = ['borderType', 'gradient', 'glow', 'preset', 'badge', 'badgePosition', 'animation'];
  const allowedBadges = ['none', 'star', 'crown', 'flame', 'heart', 'sparkle', 'bolt', 'custom'];
  const allowedBadgePositions = ['bottom-right', 'top-right', 'top-left', 'bottom-left'];
  const allowedAnimations = ['none', 'shimmer', 'dashed', 'spin'];
  for (const key of Object.keys(raw)) {
    if (!allowed.includes(key)) continue;
    const v = raw[key];
    if (key === 'borderType' && (v === 'none' || v === 'gradient' || v === 'glow' || v === 'preset')) out[key] = v;
    else if (key === 'badge' && typeof v === 'string' && allowedBadges.includes(v)) out[key] = v;
    else if (key === 'badgePosition' && typeof v === 'string' && allowedBadgePositions.includes(v)) out[key] = v;
    else if (key === 'animation' && typeof v === 'string' && allowedAnimations.includes(v)) out[key] = v;
    else if (key === 'gradient' && typeof v === 'object' && v !== null && !Array.isArray(v)) {
      const g = v as Record<string, unknown>;
      const colors = Array.isArray(g.colors) ? g.colors.filter((c) => typeof c === 'string').slice(0, 4) : [];
      if (colors.length >= 2) {
        out[key] = {
          colors,
          angle: typeof g.angle === 'number' && g.angle >= 0 && g.angle <= 360 ? g.angle : 90,
          conic: !!g.conic,
          animated: !!g.animated,
          speed: typeof g.speed === 'number' && g.speed >= 0.2 && g.speed <= 3 ? g.speed : 1,
        };
      }
    } else if (key === 'glow' && typeof v === 'object' && v !== null && !Array.isArray(v)) {
      const gl = v as Record<string, unknown>;
      out[key] = {
        enabled: !!gl.enabled,
        color: typeof gl.color === 'string' ? gl.color : '#ff00cc',
        intensity: typeof gl.intensity === 'number' && gl.intensity >= 0 && gl.intensity <= 1 ? gl.intensity : 0.5,
        pulse: !!gl.pulse,
      };
    } else if (key === 'preset' && typeof v === 'string' && ['gamer', 'soft', 'premium', 'fire'].includes(v)) out[key] = v;
  }
  if (Object.keys(out).length === 0 && !out.badge) return undefined;
  const json = JSON.stringify(out);
  if (Buffer.byteLength(json, 'utf8') > MAX_AVATAR_FRAME_BYTES) return undefined;
  return out;
}

const userSelectWithoutPassword = {
  id: true,
  email: true,
  username: true,
  displayName: true,
  bio: true,
  profileHTML: true,
  avatarUrl: true,
  avatarShape: true,
  avatarFrame: true,
  badgeUrl: true,
  isSuperadmin: true,
  whoCanSeeLikes: true,
  whoCanSeeFollowing: true,
  whoCanSeeFollowers: true,
  whoCanFollowMe: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  /** For auth: returns only id, email, passwordHash so we can verify then fetch user without hash. */
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, passwordHash: true },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: userSelectWithoutPassword,
    });
  }

  async findMe(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        bio: true,
        profileHTML: true,
        avatarUrl: true,
        avatarShape: true,
        avatarFrame: true,
        badgeUrl: true,
        isSuperadmin: true,
        whoCanSeeLikes: true,
        whoCanSeeFollowing: true,
        whoCanSeeFollowers: true,
        whoCanFollowMe: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { likes: true } },
      },
    });
    if (!user) return null;
    const postsCount = await this.prisma.post.count({
      where: { authorId: id, isPublished: true, archivedAt: null },
    });
    return {
      ...user,
      _count: {
        ...(user._count ?? {}),
        posts: postsCount,
      },
    };
  }

  /** Returns profile by username. If profile is superadmin and viewer is not that user, returns null (invisible). */
  async findByUsername(username: string, viewerId?: string | null) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        profileHTML: true,
        avatarUrl: true,
        avatarShape: true,
        avatarFrame: true,
        badgeUrl: true,
        isSuperadmin: true,
        createdAt: true,
        updatedAt: true,
        whoCanSeeLikes: true,
        whoCanSeeFollowing: true,
        whoCanSeeFollowers: true,
        whoCanFollowMe: true,
        _count: { select: { followers: true, following: true, reposts: true, likes: true } },
      },
    });
    if (!user) return null;
    if ((user as { isSuperadmin?: boolean }).isSuperadmin && viewerId !== user.id) return null;
    const postsCount = await this.prisma.post.count({
      where: {
        authorId: user.id,
        isPublished: true,
        archivedAt: null,
        isAnonymous: false,
      },
    });
    const isOwnProfile = viewerId === user.id;
    const anonymousPostsCount = isOwnProfile
      ? await this.prisma.post.count({
          where: {
            authorId: user.id,
            isPublished: true,
            archivedAt: null,
            isAnonymous: true,
          },
        })
      : 0;
    return {
      ...user,
      _count: {
        ...user._count,
        posts: postsCount,
        ...(isOwnProfile ? { anonymousPosts: anonymousPostsCount } : {}),
      },
    };
  }

  async create(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
    });
    if (existing) {
      if (existing.email === dto.email) throw new ConflictException('Email already registered');
      throw new ConflictException('Username already taken');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: { email: dto.email, username: dto.username, passwordHash },
      select: userSelectWithoutPassword,
    });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    const profileHTML =
      dto.profileHTML !== undefined
        ? DOMPurify.sanitize(dto.profileHTML, {
            ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'span', 'div'],
            ALLOWED_ATTR: ['href', 'src', 'alt', 'class'],
          })
        : undefined;
    const allowed = ['circle', 'square', 'rounded', 'squircle']
    const avatarShape =
      typeof dto.avatarShape === 'string' && allowed.includes(dto.avatarShape)
        ? dto.avatarShape
        : dto.avatarShape === '' || dto.avatarShape === null
          ? null
          : undefined;
    const avatarFrame = sanitizeAvatarFrame(dto.avatarFrame);
    const avatarFrameData =
      avatarFrame === undefined
        ? undefined
        : avatarFrame === null
          ? Prisma.DbNull
          : (avatarFrame as Prisma.InputJsonValue);
    const privacy: Record<string, string> = {};
    const whoSee = (v: string | undefined) => (typeof v === 'string' ? v.trim().toUpperCase() : undefined);
    if (dto.whoCanSeeLikes != null) {
      const n = whoSee(dto.whoCanSeeLikes);
      if (n && (PRIVACY_VISIBILITY as readonly string[]).includes(n)) privacy.whoCanSeeLikes = n;
    }
    if (dto.whoCanSeeFollowing != null) {
      const n = whoSee(dto.whoCanSeeFollowing);
      if (n && (PRIVACY_VISIBILITY as readonly string[]).includes(n)) privacy.whoCanSeeFollowing = n;
    }
    if (dto.whoCanSeeFollowers != null) {
      const n = whoSee(dto.whoCanSeeFollowers);
      if (n && (PRIVACY_VISIBILITY as readonly string[]).includes(n)) privacy.whoCanSeeFollowers = n;
    }
    if (dto.whoCanFollowMe != null) {
      const n = whoSee(dto.whoCanFollowMe);
      if (n && (WHO_CAN_FOLLOW_ME as readonly string[]).includes(n)) privacy.whoCanFollowMe = n;
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        displayName: dto.displayName,
        bio: dto.bio,
        avatarUrl: dto.avatarUrl,
        ...(profileHTML !== undefined && { profileHTML }),
        ...(avatarShape !== undefined && { avatarShape }),
        ...(avatarFrameData !== undefined && { avatarFrame: avatarFrameData }),
        ...privacy,
      },
      select: userSelectWithoutPassword,
    });
  }

  /** Save avatar to database */
  async saveAvatar(userId: string, buffer: Buffer, mimeType: string) {
    const avatarUrl = `/users/avatar/${userId}`;
    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl, avatarData: buffer, avatarMimeType: mimeType },
    });
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: userSelectWithoutPassword,
    });
  }

  /** Get avatar image buffer and mime type for a user (for DB-stored avatars). */
  async getAvatar(userId: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarData: true, avatarMimeType: true },
    });
    if (!user?.avatarData || !user.avatarMimeType) return null;
    return { buffer: Buffer.from(user.avatarData), mimeType: user.avatarMimeType };
  }

  /**
   * Save custom badge image. Accepts PNG or WebP (transparency), max 100 KB.
   * Resizes to 64x64 PNG for consistent display and small storage (favicon-like).
   */
  async saveBadge(userId: string, buffer: Buffer, mimeType: string) {
    if (buffer.length > MAX_BADGE_SIZE) {
      throw new BadRequestException(`Badge image must be under ${MAX_BADGE_SIZE / 1024} KB`);
    }
    if (!['image/png', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon'].includes(mimeType)) {
      throw new BadRequestException('Badge must be PNG or WebP (transparent background recommended).');
    }
    if (mimeType === 'image/x-icon' || mimeType === 'image/vnd.microsoft.icon') {
      throw new BadRequestException('ICO favicons are not supported. Please export or save your icon as PNG or WebP (e.g. use "Export as PNG" in your editor or a favicon-to-PNG converter).');
    }
    const inputBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    const sharpOptions: SharpOptions = {
      failOnError: true,
      limitInputPixels: 4096 * 4096,
    };
    let pngBuffer: Buffer;
    try {
      const pipeline = sharp(inputBuffer, sharpOptions);
      pngBuffer = await pipeline
        .ensureAlpha()
        .resize(BADGE_TARGET_SIZE, BADGE_TARGET_SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png({ compressionLevel: 6 })
        .toBuffer();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (process.env.NODE_ENV !== 'production') {
        console.error('[saveBadge] sharp error:', msg);
      }
      const lower = msg.toLowerCase();
      const knownSharp =
        lower.includes('vips') ||
        lower.includes('load') ||
        lower.includes('decode') ||
        lower.includes('buffer') ||
        lower.includes('corrupt') ||
        lower.includes('header') ||
        lower.includes('invalid') ||
        lower.includes('unsupported') ||
        lower.includes('format') ||
        lower.includes('expected') ||
        lower.includes('width') ||
        lower.includes('height') ||
        lower.includes('pixel') ||
        lower.includes('limit') ||
        lower.includes('exceed') ||
        lower.includes('png') ||
        lower.includes('write') ||
        lower.includes('target') ||
        lower.includes('truncat') ||
        lower.includes('eof') ||
        lower.includes('process');
      const friendly =
        knownSharp
          ? 'Image could not be read. Try opening it in an image editor and re-saving as PNG or WebP (max 100 KB). Avoid ICO/favicon files.'
          : 'Image could not be processed. Try a different PNG or WebP file under 100 KB, or re-save it in an image editor.';
      throw new BadRequestException(friendly);
    }
    const badgeUrl = `/users/badge/${userId}`;
    await this.prisma.user.update({
      where: { id: userId },
      data: { badgeUrl, badgeData: pngBuffer, badgeMimeType: BADGE_MIME },
    });
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: userSelectWithoutPassword,
    });
  }

  async getBadge(userId: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { badgeData: true, badgeMimeType: true },
    });
    if (!user?.badgeData || !user.badgeMimeType) return null;
    return { buffer: Buffer.from(user.badgeData), mimeType: user.badgeMimeType };
  }

  async deleteBadge(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { badgeUrl: null, badgeData: null, badgeMimeType: null },
    });
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: userSelectWithoutPassword,
    });
  }
}
