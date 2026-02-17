import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContentType, Prisma } from '@prisma/client';
import { mapPost } from '../utils/response.utils';
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const sharp = require('sharp') as typeof import('sharp');
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');
import { PrismaService } from '../prisma/prisma.service';
import { MarkdownRenderer } from './renderers/markdown.renderer';
import { HtmlRenderer } from './renderers/html.renderer';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { extractFirstUrl, fetchLinkPreview } from './link-preview.service';

export const MAX_IMAGES_PER_POST = 5;

const ANONYMOUS_ALIASES = [
  'Ganja Grin',
  'Giggly Ghost Pepper',
  'Noodle Ninja',
  'Bubblegum Bandit',
  'Whimsical Walrus',
  'Pickle Pirate',
  'Sassy Sock Puppet',
  'Pickle Rick',
  'Fizzy Flamingo',
  'Mischief Mushroom',
  'Sherlock Shroom',
  'Quixote Quesadilla',
  'Trimalchio Taco',
  'Lucius Lollipop',
  'Hannah Montana',
  'I\'m Anonymous For Some Reason',
  'Erotic Neurotic',
] as const;

function pickAnonymousAlias(): string {
  return ANONYMOUS_ALIASES[Math.floor(Math.random() * ANONYMOUS_ALIASES.length)];
}

/** Count image references in post content (markdown ![alt](url) or HTML <img). */
function countImagesInContent(content: string, contentType: ContentType): number {
  if (!content) return 0;
  if (contentType === 'MARKDOWN') {
    const matches = content.matchAll(/!\[[^\]]*\]\([^)]+\)/g);
    return [...matches].length;
  }
  return (content.match(/<img\s/gi) || []).length;
}

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private markdown: MarkdownRenderer,
    private html: HtmlRenderer,
  ) { }

  private renderContent(content: string, type: ContentType): string {
    switch (type) {
      case ContentType.MARKDOWN:
        return this.markdown.render(content);
      case ContentType.HTML:
      case ContentType.WYSIWYG:
        return this.html.render(content);
      default:
        return this.html.render(content);
    }
  }

  private pollInclude(userId?: string | null) {
    return {
      include: {
        options: {
          orderBy: { order: 'asc' as const },
          include: { _count: { select: { votes: true } } },
        },
        ...(userId ? { votes: { where: { userId }, select: { pollOptionId: true } } } : {}),
      },
    };
  }

  private postInclude(userId?: string | null) {
    return {
      author: { select: { id: true, username: true, displayName: true, avatarUrl: true, avatarShape: true, avatarFrame: true, badgeUrl: true } },
      _count: { select: { likes: true, comments: true, reposts: true } },
      poll: this.pollInclude(userId ?? null),
      ...(userId ? {
        likes: { where: { userId }, take: 1, select: { id: true } },
        bookmarks: { where: { userId }, take: 1, select: { id: true } },
        reposts: { where: { userId }, take: 1, select: { id: true } },
      } : {}),
    };
  }

  async create(authorId: string, dto: CreatePostDto) {
    const count = countImagesInContent(dto.content, dto.contentType);
    if (count > MAX_IMAGES_PER_POST) {
      throw new BadRequestException(`A post can have at most ${MAX_IMAGES_PER_POST} images. This post has ${count}.`);
    }
    const renderedHTML = this.renderContent(dto.content, dto.contentType);
    const isAnonymous = !!dto.isAnonymous;
    const anonymousAlias = isAnonymous ? pickAnonymousAlias() : null;
    const hasPoll = dto.poll && Array.isArray(dto.poll.options) && dto.poll.options.length > 0;

    if (hasPoll) {
      const pollOptions = (dto.poll!.options as string[]).map((t) => t.trim()).filter(Boolean);
      if (pollOptions.length === 0) throw new BadRequestException('Poll must have at least one option');
      const post = await this.prisma.$transaction(async (tx) => {
        const created = await tx.post.create({
          data: {
            authorId,
            title: dto.title,
            content: dto.content,
            contentType: dto.contentType,
            renderedHTML,
            tags: (dto.tags ?? []).map((t) => t.trim().toLowerCase()).filter(Boolean),
            imageUrls: dto.imageUrls ?? [],
            isPublished: dto.isPublished ?? false,
            publishedAt: dto.isPublished ? new Date() : null,
            visibility: dto.visibility ?? 'PUBLIC',
            isAnonymous,
            anonymousAlias,
          },
        });
        await tx.poll.create({
          data: {
            postId: created.id,
            isOpen: !!dto.poll!.isOpen,
            resultsVisible: dto.poll!.resultsVisible !== false,
            allowMultiple: !!dto.poll!.allowMultiple,
            allowChangeVote: !!dto.poll!.allowChangeVote,
            options: {
              create: pollOptions.map((text, order) => ({ text, order })),
            },
          },
        });
        return tx.post.findUnique({
          where: { id: created.id },
          include: {
            author: { select: { id: true, username: true, displayName: true, avatarUrl: true, avatarShape: true, avatarFrame: true, badgeUrl: true } },
            poll: this.pollInclude(authorId),
          },
        });
      });
      this.refreshLinkPreview(post!.id, dto.content).catch(() => { });
      return post!;
    }

    const post = await this.prisma.post.create({
      data: {
        authorId,
        title: dto.title,
        content: dto.content,
        contentType: dto.contentType,
        renderedHTML,
        tags: (dto.tags ?? []).map((t) => t.trim().toLowerCase()).filter(Boolean),
        imageUrls: dto.imageUrls ?? [],
        isPublished: dto.isPublished ?? false,
        publishedAt: dto.isPublished ? new Date() : null,
        visibility: dto.visibility ?? 'PUBLIC',
        isAnonymous,
        anonymousAlias,
      },
      include: { author: { select: { id: true, username: true, displayName: true, avatarUrl: true, avatarShape: true, avatarFrame: true, badgeUrl: true } } },
    });
    this.refreshLinkPreview(post.id, dto.content).catch(() => { });
    return post;
  }

  async findAll(limit = 20, offset = 0, userId?: string | null, isSuperadmin = false) {
    const visibilityFilter = isSuperadmin
      ? {}
      : userId
        ? {
          OR: [
            { visibility: 'PUBLIC' as const },
            { visibility: 'FOLLOWERS_ONLY' as const, author: { followers: { some: { followerId: userId } } } },
            { visibility: 'FOLLOWERS_ONLY' as const, authorId: userId },
          ],
        }
        : { visibility: 'PUBLIC' as const };
    const posts = await this.prisma.post.findMany({
      where: { isPublished: true, archivedAt: null, ...visibilityFilter },
      orderBy: { publishedAt: 'desc' },
      take: limit,
      skip: offset,
      include: this.postInclude(userId),
    });
    return posts.map(p => mapPost(p, userId));
  }

  async findOne(id: string, userId?: string | null) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: this.postInclude(userId),
    });
    if (!post) throw new NotFoundException('Post not found');
    return mapPost(post, userId);
  }

  async findOnePublic(id: string, userId?: string, isSuperadmin = false) {
    const post = await this.findOne(id, userId ?? null);
    const isAuthor = userId && post.authorId === userId;
    if (!post.isPublished) throw new NotFoundException('Post not found');
    if (post.archivedAt && !isAuthor) throw new NotFoundException('Post not found');
    if ((post as { visibility?: string }).visibility === 'FOLLOWERS_ONLY' && !isAuthor) {
      const follows = userId
        ? await this.prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: userId, followingId: post.authorId } },
        })
        : null;
      if (!follows) throw new NotFoundException('Post not found');
    }
    // Increment view count in background so we don't wait; return the post we already have (avoids second findOne).
    this.prisma.post.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => { });
    return post;
  }

  /** Fetch poll with options for a post (same visibility as findOnePublic). Use when post view needs poll options. */
  async getPollForPost(postId: string, userId?: string | null) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        authorId: true,
        isPublished: true,
        archivedAt: true,
        visibility: true,
        poll: {
          include: {
            options: {
              orderBy: { order: 'asc' as const },
              include: { _count: { select: { votes: true } } },
            },
            ...(userId ? { votes: { where: { userId }, take: 1, select: { pollOptionId: true } } } : {}),
          },
        },
      },
    });
    if (!post) throw new NotFoundException('Post not found');
    if (!post.isPublished) throw new NotFoundException('Post not found');
    const isAuthor = userId && post.authorId === userId;
    if (post.archivedAt && !isAuthor) throw new NotFoundException('Post not found');
    if ((post as { visibility?: string }).visibility === 'FOLLOWERS_ONLY' && !isAuthor) {
      const follows = userId
        ? await this.prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: userId, followingId: post.authorId } },
        })
        : null;
      if (!follows) throw new NotFoundException('Post not found');
    }
    if (!post.poll) throw new NotFoundException('Poll not found');
    return post.poll;
  }

  async update(id: string, userId: string, dto: UpdatePostDto) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== userId) throw new ForbiddenException('Not your post');
    if (dto.content != null) {
      const contentType = dto.contentType ?? post.contentType;
      const count = countImagesInContent(dto.content, contentType);
      if (count > MAX_IMAGES_PER_POST) {
        throw new BadRequestException(`A post can have at most ${MAX_IMAGES_PER_POST} images. This post has ${count}.`);
      }
    }
    const renderedHTML = dto.content != null ? this.renderContent(dto.content, dto.contentType ?? post.contentType) : undefined;
    const updated = await this.prisma.post.update({
      where: { id },
      data: {
        ...(dto.title != null && { title: dto.title }),
        ...(dto.content != null && { content: dto.content }),
        ...(dto.contentType != null && { contentType: dto.contentType }),
        ...(renderedHTML != null && { renderedHTML }),
        ...(dto.tags != null && { tags: dto.tags.map((t) => t.trim().toLowerCase()).filter(Boolean) }),
        ...(dto.isPublished != null && {
          isPublished: dto.isPublished,
          publishedAt: dto.isPublished ? new Date() : post.publishedAt,
        }),
        ...(dto.visibility != null && { visibility: dto.visibility }),
      },
      include: { author: { select: { id: true, username: true, displayName: true, avatarUrl: true, avatarShape: true, avatarFrame: true, badgeUrl: true } } },
    });
    if (dto.content != null) this.refreshLinkPreview(updated.id, dto.content).catch(() => { });
    return updated;
  }

  /** Fetch OG metadata for first URL in content and save to post.linkPreview (runs in background). */
  private async refreshLinkPreview(postId: string, content: string): Promise<void> {
    const url = extractFirstUrl(content);
    if (!url) {
      await this.prisma.post.update({ where: { id: postId }, data: { linkPreview: Prisma.DbNull } });
      return;
    }
    const preview = await fetchLinkPreview(url);
    await this.prisma.post.update({
      where: { id: postId },
      data: { linkPreview: preview ? (preview as unknown as Prisma.InputJsonValue) : Prisma.DbNull },
    });
  }

  async remove(id: string, userId: string, isSuperadmin = false) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    if (!isSuperadmin && post.authorId !== userId) throw new ForbiddenException('Not your post');
    await this.prisma.post.delete({ where: { id } });
    return { deleted: true };
  }

  async archive(id: string, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== userId) throw new ForbiddenException('Not your post');
    await this.prisma.post.update({
      where: { id },
      data: { archivedAt: new Date() },
    });
    return { archived: true };
  }

  async unarchive(id: string, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== userId) throw new ForbiddenException('Not your post');
    await this.prisma.post.update({
      where: { id },
      data: { archivedAt: null },
    });
    return { archived: false };
  }

  async findByAuthor(
    username: string,
    limit = 20,
    offset = 0,
    viewerUserId?: string | null,
    tab?: 'posts' | 'anonymous',
  ) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) throw new NotFoundException('User not found');
    const isOwnProfile = viewerUserId === user.id;
    const isFollower =
      viewerUserId &&
      (await this.prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: viewerUserId, followingId: user.id } },
      }));
    const visibilityFilter =
      isOwnProfile || isFollower
        ? {}
        : { visibility: 'PUBLIC' as const };
    const anonymousFilter =
      tab === 'anonymous'
        ? isOwnProfile
          ? { isAnonymous: true as const }
          : { isAnonymous: false as const }
        : { isAnonymous: false as const };
    return this.prisma.post.findMany({
      where: { authorId: user.id, isPublished: true, archivedAt: null, ...visibilityFilter, ...anonymousFilter },
      orderBy: { publishedAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        author: { select: { id: true, username: true, displayName: true, avatarUrl: true, avatarShape: true, avatarFrame: true, badgeUrl: true } },
        _count: { select: { likes: true, comments: true, reposts: true } },
        poll: this.pollInclude(viewerUserId ?? null),
        ...(viewerUserId ? {
          likes: { where: { userId: viewerUserId }, take: 1, select: { id: true } },
          bookmarks: { where: { userId: viewerUserId }, take: 1, select: { id: true } },
          reposts: { where: { userId: viewerUserId }, take: 1, select: { id: true } },
        } : {}),
      },
    });
  }

  async findArchivedByUser(userId: string, limit = 50, offset = 0) {
    return this.prisma.post.findMany({
      where: { authorId: userId, isPublished: true, archivedAt: { not: null } },
      orderBy: { archivedAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        author: { select: { id: true, username: true, displayName: true, avatarUrl: true, avatarShape: true, avatarFrame: true, badgeUrl: true } },
        _count: { select: { likes: true, comments: true, reposts: true } },
      },
    });
  }

  async export(
    id: string,
    format: string,
    userId: string | null,
    isSuperadmin = false,
  ): Promise<{ format: string; filename: string; buffer: Buffer }> {
    const post = await this.findOnePublic(id, userId ?? undefined, isSuperadmin);
    const safeTitle = (post.title || 'post').replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').slice(0, 80);
    const filename = safeTitle || 'export';
    if (format === 'docx') {
      const buffer = await this.exportDocx(post);
      return { format: 'docx', filename, buffer };
    }
    const buffer = await this.exportPdf(post);
    return { format: 'pdf', filename, buffer };
  }

  private async exportPdf(post: { title: string; content: string; author?: { displayName?: string | null; username?: string }; anonymousAlias?: string | null }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ margin: 50 });

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: Error) => reject(err));

      const author = post.anonymousAlias ?? post.author?.displayName ?? post.author?.username ?? 'Unknown';

      // Title
      doc.fontSize(24).font('Helvetica-Bold').text(post.title);
      doc.moveDown(0.5);

      // Author and Date
      doc.fontSize(10).font('Helvetica').fillColor('#666666').text(`By ${author} • ${new Date().toLocaleDateString()}`);
      doc.moveDown(1.5);

      // Horizontal line
      doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#eeeeee').stroke();
      doc.moveDown(1.5);

      // Content
      doc.fontSize(12).font('Helvetica').fillColor('#000000').text(post.content, {
        align: 'justify',
        paragraphGap: 10,
        lineGap: 4
      });

      doc.end();
    });
  }

  private async exportDocx(post: { title: string; content: string }): Promise<Buffer> {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');
    const titlePara = new Paragraph({ text: post.title, heading: HeadingLevel.TITLE });
    const contentParas = post.content
      .split(/\n\n+/)
      .filter((p) => p.trim())
      .map((p) => new Paragraph({ children: [new TextRun({ text: p.trim() })] }));
    const doc = new Document({
      sections: [{ children: [titlePara, ...contentParas] }],
    });
    return Packer.toBuffer(doc);
  }

  /** Compress image for web (max width 1600, quality 82). Returns buffer and mime type. */
  private async compressPostImage(buffer: Buffer, mimeType: string): Promise<{ buffer: Buffer; mimeType: string }> {
    try {
      const pipeline = sharp(buffer)
        .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
        .rotate(); // auto-orient from EXIF
      const isPng = mimeType === 'image/png';
      const output = isPng
        ? pipeline.png({ quality: 85, compressionLevel: 6 })
        : pipeline.jpeg({ quality: 82, mozjpeg: true }); // jpeg for jpeg/gif/webp
      const outBuffer = await output.toBuffer();
      const outMime = isPng ? 'image/png' : 'image/jpeg';
      return { buffer: outBuffer, mimeType: outMime };
    } catch {
      return { buffer, mimeType };
    }
  }

  /** Vote on a poll. Supports allowMultiple (toggle option) and allowChangeVote (unvote by clicking same option). */
  async votePoll(postId: string, userId: string, optionId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        poll: {
          include: {
            options: true,
          },
        },
      },
    });
    if (!post || !post.poll) throw new NotFoundException('Post or poll not found');
    const poll = post.poll as { id: string; allowMultiple?: boolean; allowChangeVote?: boolean; options: { id: string }[] };
    const option = poll.options.find((o) => o.id === optionId);
    if (!option) throw new BadRequestException('Invalid poll option');

    const existing = await this.prisma.pollVote.findMany({
      where: { userId, pollId: poll.id },
      select: { pollOptionId: true },
    });
    const votedOptionIds = existing.map((v) => v.pollOptionId);
    const alreadyVotedThis = votedOptionIds.includes(optionId);

    if (poll.allowMultiple) {
      if (alreadyVotedThis) {
        await this.prisma.pollVote.deleteMany({
          where: { userId, pollId: poll.id, pollOptionId: optionId },
        });
      } else {
        await this.prisma.pollVote.create({
          data: { userId, pollId: poll.id, pollOptionId: optionId },
        });
      }
    } else {
      if (alreadyVotedThis && poll.allowChangeVote) {
        await this.prisma.pollVote.deleteMany({
          where: { userId, pollId: poll.id },
        });
      } else if (!alreadyVotedThis || !poll.allowChangeVote) {
        await this.prisma.pollVote.deleteMany({ where: { userId, pollId: poll.id } });
        await this.prisma.pollVote.create({
          data: { userId, pollId: poll.id, pollOptionId: optionId },
        });
      }
    }
    return this.findOne(postId, userId);
  }

  /** List voters for a poll (author only). Returns users who voted and their chosen option(s). */
  async getPollVoters(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { poll: { select: { id: true } } },
    });
    if (!post || !post.poll) throw new NotFoundException('Post or poll not found');
    if (post.authorId !== userId) throw new ForbiddenException('Only the poll author can view voters');
    const votes = await this.prisma.pollVote.findMany({
      where: { pollId: post.poll.id },
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        pollOption: { select: { id: true, text: true } },
      },
      orderBy: [{ userId: 'asc' }, { pollOptionId: 'asc' }],
    });
    const byUser = new Map<
      string,
      { id: string; username: string; displayName: string | null; avatarUrl: string | null; options: { id: string; text: string }[] }
    >();
    for (const v of votes) {
      const u = v.user;
      if (!byUser.has(u.id)) {
        byUser.set(u.id, {
          id: u.id,
          username: u.username,
          displayName: u.displayName,
          avatarUrl: u.avatarUrl,
          options: [],
        });
      }
      byUser.get(u.id)!.options.push({ id: v.pollOption.id, text: v.pollOption.text });
    }
    return { voters: Array.from(byUser.values()) };
  }

  /** Add an option to an open poll (only when poll.isOpen or user is author). */
  async addPollOption(postId: string, userId: string, text: string) {
    const trimmed = text.trim();
    if (!trimmed) throw new BadRequestException('Option text is required');
    if (trimmed.length > 500) throw new BadRequestException('Option text too long');
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { poll: { include: { options: true } } },
    });
    if (!post || !post.poll) throw new NotFoundException('Post or poll not found');
    const isAuthor = post.authorId === userId;
    if (!post.poll.isOpen && !isAuthor) throw new ForbiddenException('This poll is closed to new options');
    const nextOrder = post.poll.options.length > 0 ? Math.max(...post.poll.options.map((o) => o.order)) + 1 : 0;
    await this.prisma.pollOption.create({
      data: { pollId: post.poll.id, text: trimmed, order: nextOrder },
    });
    return this.findOne(postId, userId);
  }

  /** Save post image to database (persists on ephemeral hosts; no external storage). Compresses image. Returns URL for embedding in content. */
  async uploadPostImage(userId: string, buffer: Buffer, mimeType: string): Promise<{ url: string }> {
    const { buffer: compressed, mimeType: outMime } = await this.compressPostImage(buffer, mimeType);
    const image = await this.prisma.postImage.create({
      data: { userId, data: compressed, mimeType: outMime },
    });
    const baseUrl = (this.config.get<string>('API_PUBLIC_URL') || `http://localhost:${this.config.get('PORT', 3000)}`).replace(/\/$/, '');
    const url = `${baseUrl}/posts/images/${image.id}`;
    return { url };
  }

  /** Get post image by id for serving (DB-stored images). */
  async getPostImage(id: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
    const row = await this.prisma.postImage.findUnique({
      where: { id },
      select: { data: true, mimeType: true },
    });
    if (!row) return null;
    return { buffer: Buffer.from(row.data), mimeType: row.mimeType };
  }
}
