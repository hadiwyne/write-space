import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const postInclude = {
  author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
  _count: { select: { likes: true, comments: true } },
};

@Injectable()
export class BookmarksService {
  constructor(private prisma: PrismaService) {}

  async toggle(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    const existing = await this.prisma.bookmark.findUnique({
      where: { userId_postId: { userId, postId } },
    });
    if (existing) {
      await this.prisma.bookmark.delete({ where: { id: existing.id } });
      return { bookmarked: false };
    }
    await this.prisma.bookmark.create({ data: { userId, postId } });
    return { bookmarked: true };
  }

  async findByUser(userId: string, limit = 50, offset = 0) {
    const items = await this.prisma.bookmark.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: { post: { include: postInclude } },
    });
    return items.map((b) => ({ ...b.post, bookmarkedAt: b.createdAt }));
  }

  async userHasBookmark(postId: string, userId: string): Promise<boolean> {
    const b = await this.prisma.bookmark.findUnique({
      where: { userId_postId: { userId, postId } },
    });
    return !!b;
  }
}
