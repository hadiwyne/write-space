import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContentType, Prisma } from '@prisma/client';
import sharp from 'sharp';
import { PrismaService } from '../prisma/prisma.service';
import { MarkdownRenderer } from './renderers/markdown.renderer';
import { HtmlRenderer } from './renderers/html.renderer';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { extractFirstUrl, fetchLinkPreview } from './link-preview.service';

export const MAX_IMAGES_PER_POST = 5;

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
  ) {}

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

  async create(authorId: string, dto: CreatePostDto) {
    const count = countImagesInContent(dto.content, dto.contentType);
    if (count > MAX_IMAGES_PER_POST) {
      throw new BadRequestException(`A post can have at most ${MAX_IMAGES_PER_POST} images. This post has ${count}.`);
    }
    const renderedHTML = this.renderContent(dto.content, dto.contentType);
    const post = await this.prisma.post.create({
      data: {
        authorId,
        title: dto.title,
        content: dto.content,
        contentType: dto.contentType,
        renderedHTML,
        tags: dto.tags ?? [],
        imageUrls: dto.imageUrls ?? [],
        isPublished: dto.isPublished ?? false,
        publishedAt: dto.isPublished ? new Date() : null,
        visibility: dto.visibility ?? 'PUBLIC',
      },
      include: { author: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
    });
    this.refreshLinkPreview(post.id, dto.content).catch(() => {});
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
    return this.prisma.post.findMany({
      where: { isPublished: true, archivedAt: null, ...visibilityFilter },
      orderBy: { publishedAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        _count: { select: { likes: true, comments: true, reposts: true } },
        ...(userId ? { likes: { where: { userId }, take: 1, select: { id: true } } } : {}),
      },
    });
  }

  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        _count: { select: { likes: true, comments: true, reposts: true } },
      },
    });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async findOnePublic(id: string, userId?: string, isSuperadmin = false) {
    const post = await this.findOne(id);
    if (isSuperadmin) {
      await this.prisma.post.update({ where: { id }, data: { viewCount: { increment: 1 } } });
      return this.findOne(id);
    }
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
    await this.prisma.post.update({ where: { id }, data: { viewCount: { increment: 1 } } });
    return this.findOne(id);
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
        ...(dto.tags != null && { tags: dto.tags }),
        ...(dto.isPublished != null && {
          isPublished: dto.isPublished,
          publishedAt: dto.isPublished ? new Date() : post.publishedAt,
        }),
        ...(dto.visibility != null && { visibility: dto.visibility }),
      },
      include: { author: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
    });
    if (dto.content != null) this.refreshLinkPreview(updated.id, dto.content).catch(() => {});
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

  async findByAuthor(username: string, limit = 20, offset = 0, viewerUserId?: string | null) {
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
    return this.prisma.post.findMany({
      where: { authorId: user.id, isPublished: true, archivedAt: null, ...visibilityFilter },
      orderBy: { publishedAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        _count: { select: { likes: true, comments: true, reposts: true } },
        ...(viewerUserId ? { likes: { where: { userId: viewerUserId }, take: 1, select: { id: true } } } : {}),
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
        author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
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
    const buffer = Buffer.from(this.exportHtml(post), 'utf-8');
    return { format: 'html', filename, buffer };
  }

  private exportHtml(post: { title: string; renderedHTML: string; author?: { displayName?: string | null; username?: string } }): string {
    const author = post.author?.displayName || post.author?.username || 'Unknown';
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${this.escapeHtml(post.title)}</title></head><body><article><h1>${this.escapeHtml(post.title)}</h1><p><small>By ${this.escapeHtml(author)}</small></p><div>${post.renderedHTML}</div></article></body></html>`;
  }

  private escapeHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
