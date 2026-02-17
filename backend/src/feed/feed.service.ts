import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { mapPost } from '../utils/response.utils';

function postInclude(userId: string | null) {
  return {
    author: { select: { id: true, username: true, displayName: true, avatarUrl: true, avatarShape: true, avatarFrame: true, badgeUrl: true } },
    _count: { select: { likes: true, comments: true, reposts: true } },
    poll: {
      include: {
        options: {
          orderBy: { order: 'asc' as const },
          include: { _count: { select: { votes: true } } },
        },
        ...(userId ? { votes: { where: { userId }, take: 1, select: { pollOptionId: true } } } : {}),
      },
    },
    ...(userId ? {
      likes: { where: { userId }, take: 1, select: { id: true } },
      bookmarks: { where: { userId }, take: 1, select: { id: true } },
      reposts: { where: { userId }, take: 1, select: { id: true } },
    } : {}),
  };
}

const baseWhere = { isPublished: true, archivedAt: null };

@Injectable()
export class FeedService {
  constructor(private prisma: PrismaService) { }

  /** Posts only from people the user follows (not the user's own posts). Requires userId. */
  async getFriends(userId: string, limit = 20, offset = 0, tag?: string) {
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const authorIds = [userId, ...following.map((f) => f.followingId)];
    if (!authorIds.length) return [];

    const authorIdsStr = authorIds.map(id => `'${id}'`).join(',');
    const tagPart = tag ? `AND '${tag}' = ANY(p.tags)` : '';

    const sql = `
      WITH timeline AS (
        -- Original posts from people I follow
        SELECT 
          p.id as "id",
          p.published_at as "event_at",
          NULL::text as "repost_id",
          NULL::text as "reposter_id"
        FROM posts p
        WHERE p.is_published = true AND p.archived_at IS NULL 
        AND p.author_id IN (${authorIdsStr})
        ${tagPart}

        UNION ALL

        -- Reposts by people I follow
        SELECT 
          r.post_id as "id",
          r.created_at as "event_at",
          r.id as "repost_id",
          r.user_id as "reposter_id"
        FROM reposts r
        JOIN posts p ON r.post_id = p.id
        WHERE p.is_published = true AND p.archived_at IS NULL 
        AND r.user_id IN (${authorIdsStr})
        ${tagPart}
      )
      SELECT * FROM timeline
      ORDER BY event_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const events = await this.prisma.$queryRawUnsafe<any[]>(sql);
    return this.enrichEvents(events, userId);
  }

  async getChronological(userId: string | null, limit = 20, offset = 0, tag?: string, isSuperadmin = false) {
    // Visibility query snippet for raw SQL
    let visibilityPart = '';
    if (!isSuperadmin) {
      if (userId) {
        visibilityPart = `AND (
          p.visibility = 'PUBLIC' 
          OR (p.visibility = 'FOLLOWERS_ONLY' AND (
            EXISTS (SELECT 1 FROM follows f WHERE f.following_id = p.author_id AND f.follower_id = '${userId}')
            OR p.author_id = '${userId}'
          ))
        )`;
      } else {
        visibilityPart = "AND p.visibility = 'PUBLIC'";
      }
    }

    const tagPart = tag ? `AND '${tag}' = ANY(p.tags)` : '';

    // Unified query: original posts (as events) + reposts (as events)
    const sql = `
      WITH timeline AS (
        -- Original posts
        SELECT 
          p.id as "id",
          p.published_at as "event_at",
          NULL::text as "repost_id",
          NULL::text as "reposter_id"
        FROM posts p
        WHERE p.is_published = true AND p.archived_at IS NULL ${visibilityPart} ${tagPart}

        UNION ALL

        -- Reposts
        SELECT 
          r.post_id as "id",
          r.created_at as "event_at",
          r.id as "repost_id",
          r.user_id as "reposter_id"
        FROM reposts r
        JOIN posts p ON r.post_id = p.id
        WHERE p.is_published = true AND p.archived_at IS NULL ${visibilityPart} ${tagPart}
      )
      SELECT * FROM timeline
      ORDER BY event_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const events = await this.prisma.$queryRawUnsafe<any[]>(sql);
    return this.enrichEvents(events, userId);
  }

  private async enrichEvents(events: any[], userId: string | null) {
    if (!events.length) return [];

    // Map events back to full post objects
    const postIds = [...new Set(events.map(e => e.id))];
    const reposterIds = [...new Set(events.map(e => e.reposter_id).filter(Boolean))];

    const [posts, users] = await Promise.all([
      this.prisma.post.findMany({
        where: { id: { in: postIds } },
        include: postInclude(userId),
      }),
      this.prisma.user.findMany({
        where: { id: { in: reposterIds } },
        select: { id: true, username: true, displayName: true },
      })
    ]);

    const postMap = new Map(posts.map(p => [p.id, p]));
    const userMap = new Map(users.map(u => [u.id, u]));

    return events.map(event => {
      const post = postMap.get(event.id);
      if (!post) return null;

      const postData = JSON.parse(JSON.stringify(post));
      const result = { ...postData, eventAt: event.event_at };
      const mapped = mapPost(result, userId);

      if (event.repost_id) {
        (mapped as any).repostData = {
          id: event.repost_id,
          userId: event.reposter_id,
          user: userMap.get(event.reposter_id),
        };
      }
      return mapped;
    }).filter(Boolean);
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
        const scoreA = (a._count?.likes ?? 0) * 2 + (a._count?.comments ?? 0);
        const scoreB = (b._count?.likes ?? 0) * 2 + (b._count?.comments ?? 0);
        return scoreB - scoreA;
      })
      .slice(0, limit);
    return sorted.map(p => mapPost(p, userId));
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
