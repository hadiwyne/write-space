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
      },
      include: { author: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
    });
  }

  async findAll(limit = 20, offset = 0) {
    return this.prisma.post.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });
  }

  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async findOnePublic(id: string) {
    const post = await this.findOne(id);
    if (!post.isPublished) throw new NotFoundException('Post not found');
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

  async findByAuthor(username: string, limit = 20, offset = 0) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.post.findMany({
      where: { authorId: user.id, isPublished: true },
      orderBy: { publishedAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });
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
