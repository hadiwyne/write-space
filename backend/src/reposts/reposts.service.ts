import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { mapPost } from '../utils/response.utils';

function postInclude(userId: string | null) {
  return {
    author: { select: { id: true, username: true, displayName: true, avatarUrl: true, avatarShape: true, avatarFrame: true, badgeUrl: true } },
    _count: { select: { likes: true, comments: true, reposts: true } },
    ...(userId ? {
      likes: { where: { userId }, take: 1, select: { id: true } },
      bookmarks: { where: { userId }, take: 1, select: { id: true } },
      reposts: { where: { userId }, take: 1, select: { id: true } },
    } : {}),
  } as const;
}

@Injectable()
export class RepostsService {
  constructor(private prisma: PrismaService) { }

  async toggle(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    const existing = await this.prisma.repost.findUnique({
      where: { userId_postId: { userId, postId } },
    });
    if (existing) {
      await this.prisma.repost.delete({ where: { id: existing.id } });
      const count = await this.prisma.repost.count({ where: { postId } });
      return { reposted: false, count };
    }
    await this.prisma.repost.create({ data: { userId, postId } });
    const count = await this.prisma.repost.count({ where: { postId } });
    return { reposted: true, count };
  }

  async count(postId: string): Promise<number> {
    return this.prisma.repost.count({ where: { postId } });
  }

  async userReposted(postId: string, userId: string): Promise<boolean> {
    const r = await this.prisma.repost.findUnique({
      where: { userId_postId: { userId, postId } },
    });
    return !!r;
  }

  async findByUser(username: string, limit = 50, offset = 0, viewerId?: string | null) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) throw new NotFoundException('User not found');
    const items = await this.prisma.repost.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: { post: { include: postInclude(viewerId ?? null) } },
    });
    return items.map((r: { post: any; createdAt: Date }) => ({
      ...mapPost(r.post, viewerId ?? null),
      repostedAt: r.createdAt
    }));
  }
}
