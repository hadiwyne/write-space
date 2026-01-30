import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FeedService {
  constructor(private prisma: PrismaService) {}

  async getChronological(userId: string | null, limit = 20, offset = 0) {
    const following = userId
      ? await this.prisma.follow.findMany({ where: { followerId: userId }, select: { followingId: true } })
      : [];
    const followingIds = following.map((f) => f.followingId);

    const where = followingIds.length
      ? { isPublished: true, authorId: { in: followingIds } }
      : { isPublished: true };

    return this.prisma.post.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });
  }

  async getPublicChronological(limit = 20, offset = 0) {
    return this.getChronological(null, limit, offset);
  }
}
