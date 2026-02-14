import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function postInclude(userId: string | null) {
  return {
    author: { select: { id: true, username: true, displayName: true, avatarUrl: true, avatarShape: true, avatarFrame: true, badgeUrl: true } },
    _count: { select: { likes: true, comments: true, reposts: true } },
    ...(userId ? { likes: { where: { userId }, take: 1, select: { id: true } } } : {}),
  };
}

const baseWhere = { isPublished: true, archivedAt: null };

@Injectable()
export class FeedService {
  constructor(private prisma: PrismaService) {}

  /** Posts only from people the user follows (not the user's own posts). Requires userId. */
  async getFriends(userId: string, limit = 20, offset = 0, tag?: string) {
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const authorIds = following.map((f) => f.followingId);
    const where = {
      ...baseWhere,
      authorId: { in: authorIds },
      ...(tag ? { tags: { has: tag } } : {}),
    };
    return this.prisma.post.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      take: limit,
      skip: offset,
      include: postInclude(userId),
    });
  }

  async getChronological(userId: string | null, limit = 20, offset = 0, tag?: string, isSuperadmin = false) {
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
    const where = {
      ...baseWhere,
      ...visibilityFilter,
      ...(tag ? { tags: { has: tag } } : {}),
    };

    return this.prisma.post.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      take: limit,
      skip: offset,
      include: postInclude(userId),
    });
  }

  async getPopular(limit = 20, offset = 0, tag?: string, userId?: string | null, isSuperadmin = false) {
    const visibilityFilter =
      isSuperadmin || !userId
        ? (isSuperadmin ? {} : { visibility: 'PUBLIC' as const })
        : {
            OR: [
              { visibility: 'PUBLIC' as const },
              { visibility: 'FOLLOWERS_ONLY' as const, author: { followers: { some: { followerId: userId } } } },
              { visibility: 'FOLLOWERS_ONLY' as const, authorId: userId },
            ],
          };
    const where = {
      ...baseWhere,
      ...visibilityFilter,
      ...(tag ? { tags: { has: tag } } : {}),
    };
    const posts = await this.prisma.post.findMany({
      where,
      take: limit * 2,
      skip: offset,
      include: postInclude(userId ?? null),
    });
    const sorted = posts
      .sort((a, b) => {
        const scoreA = (a._count.likes ?? 0) * 2 + (a._count.comments ?? 0);
        const scoreB = (b._count.likes ?? 0) * 2 + (b._count.comments ?? 0);
        return scoreB - scoreA;
      })
      .slice(0, limit);
    return sorted;
  }

  async getTrendingTags(limit = 10, userId?: string | null) {
    const visibilityFilter = userId ? {} : { visibility: 'PUBLIC' as const };
    const posts = await this.prisma.post.findMany({
      where: { ...baseWhere, ...visibilityFilter },
      select: { tags: true },
      take: 5000,
    });
    const count: Record<string, number> = {};
    for (const p of posts) {
      for (const t of p.tags) {
        count[t] = (count[t] ?? 0) + 1;
      }
    }
    return Object.entries(count)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([tag]) => tag);
  }

  async getTrendingPosts(limit = 5, userId?: string | null) {
    const visibilityFilter = userId
      ? {
          OR: [
            { visibility: 'PUBLIC' as const },
            { visibility: 'FOLLOWERS_ONLY' as const, author: { followers: { some: { followerId: userId } } } },
            { visibility: 'FOLLOWERS_ONLY' as const, authorId: userId },
          ],
        }
      : { visibility: 'PUBLIC' as const };
    const posts = await this.prisma.post.findMany({
      where: { ...baseWhere, ...visibilityFilter },
      take: 50,
      include: postInclude(userId ?? null),
    });
    return posts
      .sort((a, b) => {
        const scoreA = (a._count.likes ?? 0) * 2 + (a._count.comments ?? 0);
        const scoreB = (b._count.likes ?? 0) * 2 + (b._count.comments ?? 0);
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }
}
