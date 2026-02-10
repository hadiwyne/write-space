import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContentType } from '@prisma/client';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { MarkdownRenderer } from './renderers/markdown.renderer';
import { HtmlRenderer } from './renderers/html.renderer';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

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
    const renderedHTML = this.renderContent(dto.content, dto.contentType);
    return this.prisma.post.create({
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
  }

  async findAll(limit = 20, offset = 0, userId?: string | null) {
    const visibilityFilter = userId
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

  async findOnePublic(id: string, userId?: string) {
    const post = await this.findOne(id);
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
    const renderedHTML = dto.content != null ? this.renderContent(dto.content, dto.contentType ?? post.contentType) : undefined;
    return this.prisma.post.update({
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
  }

  async remove(id: string, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== userId) throw new ForbiddenException('Not your post');
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
  ): Promise<{ format: string; filename: string; buffer: Buffer }> {
    const post = await this.findOnePublic(id, userId ?? undefined);
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

  async uploadPostImage(userId: string, buffer: Buffer, mimeType: string): Promise<{ url: string }> {
    const ext = mimeType === 'image/jpeg' ? '.jpg' : mimeType === 'image/png' ? '.png' : mimeType === 'image/gif' ? '.gif' : '.webp';
    const filename = `${userId}-${Date.now()}${ext}`;
    const uploadsDir = join(process.cwd(), 'uploads', 'post-images');
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(join(uploadsDir, filename), buffer);
    const baseUrl = (this.config.get<string>('API_PUBLIC_URL') || `http://localhost:${this.config.get('PORT', 3000)}`).replace(/\/$/, '');
    const url = `${baseUrl}/uploads/post-images/${filename}`;
    return { url };
  }
}
