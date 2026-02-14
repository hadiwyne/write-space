import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const postInclude = {
  author: { select: { id: true, username: true, displayName: true, avatarUrl: true, avatarShape: true, avatarFrame: true, badgeUrl: true } },
  _count: { select: { likes: true, comments: true, reposts: true } },
};

@Injectable()
export class RepostsService {
  constructor(private prisma: PrismaService) {}

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

  async findByUser(username: string, limit = 50, offset = 0) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) throw new NotFoundException('User not found');
    const items = await this.prisma.repost.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: { post: { include: postInclude } },
    });
    return items.map((r: { post: Record<string, unknown>; createdAt: Date }) => ({ ...r.post, repostedAt: r.createdAt }));
  }
}
