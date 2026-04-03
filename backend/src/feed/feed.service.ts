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
    seriesPosts: {
      where: { status: 'APPROVED' },
      take: 1,
      orderBy: { addedAt: 'desc' as const },
      select: {
        series: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoMimeType: true,
            accentColor: true,
          },
        },
      },
    },
    ...(userId ? {
      likes: { where: { userId }, take: 1, select: { id: true } },
      bookmarks: { where: { userId }, take: 1, select: { id: true } },
      reposts: { where: { userId }, take: 1, select: { id: true } },
    } : {}),
  };
}

const baseWhere = {
  isPublished: true,
  archivedAt: null,
  NOT: { seriesPosts: { some: { status: 'PENDING' } } },
};

/**
 * Returns a Prisma `AND` clause array that adds to a `findMany` `where` to
 * hide posts whose series is inaccessible to the viewer.
 * Returns `any[]` to avoid fighting Prisma's strict generated enum types.
 *
 * - PUBLIC series  → always visible
 * - FOLLOWERS_ONLY → visible to members + followers of the series owner
 * - PRIVATE        → visible to members only
 */
function seriesVisibilityAnd(userId: string | null): any[] {
  if (!userId) {
    // Unauthenticated: only PUBLIC series + PUBLIC post visibility
    return [
      {
        NOT: {
          seriesPosts: {
            some: {
              status: 'APPROVED',
              series: { visibility: { in: ['PRIVATE', 'FOLLOWERS_ONLY'] } },
            },
          },
        },
      },
      // Block FOLLOWERS_ONLY post visibility (unauthenticated can't follow series)
      {
        NOT: {
          seriesPosts: {
            some: {
              status: 'APPROVED',
              postVisibility: 'FOLLOWERS_ONLY',
            } as any,
          },
        },
      },
    ];
  }
  return [
    // Block PRIVATE series the viewer is not a member of
    {
      NOT: {
        seriesPosts: {
          some: {
            status: 'APPROVED',
            series: {
              visibility: 'PRIVATE',
              members: { none: { userId } },
            },
          },
        },
      },
    },
    // Block FOLLOWERS_ONLY series the viewer can't access
    {
      NOT: {
        seriesPosts: {
          some: {
            status: 'APPROVED',
            series: {
              AND: [
                { visibility: 'FOLLOWERS_ONLY' },
                { NOT: { ownerId: userId } },
                { members: { none: { userId } } },
                { owner: { followers: { none: { followerId: userId } } } },
              ],
            },
          },
        },
      },
    },
    // Block FOLLOWERS_ONLY post visibility when viewer doesn't follow the series and isn't a member
    {
      NOT: {
        seriesPosts: {
          some: {
            status: 'APPROVED',
            postVisibility: 'FOLLOWERS_ONLY',
            series: {
              visibility: { not: 'PRIVATE' }, // PRIVATE series access is handled above
              follows: { none: { userId } },
              members: { none: { userId } },
            },
          } as any,
        },
      },
    },
  ];
}

/**
 * Raw SQL snippet that enforces series visibility for posts that belong to
 * an approved series. Posts not in any series are unaffected.
 */
function seriesVisibilitySql(userId: string | null): string {
  const memberCheck = userId
    ? `EXISTS (SELECT 1 FROM series_members sm WHERE sm.series_id = ser.id AND sm.user_id = '${userId}')`
    : 'false';
  const followCheck = userId
    ? `EXISTS (SELECT 1 FROM follows f WHERE f.following_id = ser.owner_id AND f.follower_id = '${userId}')`
    : 'false';
  const isOwner = userId ? `ser.owner_id = '${userId}'` : 'false';
  // Whether the viewer follows the series itself (for post-level FOLLOWERS_ONLY)
  const seriesFollowCheck = userId
    ? `EXISTS (SELECT 1 FROM series_follows sf WHERE sf.series_id = ser.id AND sf.user_id = '${userId}')`
    : 'false';

  // post_visibility gate: PUBLIC always passes; FOLLOWERS_ONLY requires series follow or membership
  const postVisGate = `(sp_v.post_visibility = 'PUBLIC' OR (sp_v.post_visibility = 'FOLLOWERS_ONLY' AND (${seriesFollowCheck} OR ${memberCheck})))`;

  // Cast visibility to text to avoid PostgreSQL enum comparison errors
  return `
    AND (
      NOT EXISTS (
        SELECT 1 FROM series_posts sp_v
        JOIN series ser ON sp_v.series_id = ser.id
        WHERE sp_v.post_id = p.id AND sp_v.status = 'APPROVED'
      )
      OR EXISTS (
        SELECT 1 FROM series_posts sp_v
        JOIN series ser ON sp_v.series_id = ser.id
        WHERE sp_v.post_id = p.id AND sp_v.status = 'APPROVED'
        AND (
          (ser.visibility::text = 'PUBLIC' AND ${postVisGate})
          OR (ser.visibility::text = 'FOLLOWERS_ONLY' AND (${isOwner} OR ${followCheck} OR ${memberCheck}) AND ${postVisGate})
          OR (ser.visibility::text = 'PRIVATE' AND ${memberCheck})
        )
      )
    )`;
}

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

    const pendingFilter = `AND NOT EXISTS (SELECT 1 FROM series_posts sp WHERE sp.post_id = p.id AND sp.status = 'PENDING')`;
    const seriesFilter = seriesVisibilitySql(userId);
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
        ${tagPart} ${pendingFilter} ${seriesFilter}

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
        ${tagPart} ${pendingFilter} ${seriesFilter}
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
    const pendingFilter = `AND NOT EXISTS (SELECT 1 FROM series_posts sp WHERE sp.post_id = p.id AND sp.status = 'PENDING')`;
    const seriesFilter = seriesVisibilitySql(userId);

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
        WHERE p.is_published = true AND p.archived_at IS NULL ${visibilityPart} ${tagPart} ${pendingFilter} ${seriesFilter}

        UNION ALL

        -- Reposts
        SELECT 
          r.post_id as "id",
          r.created_at as "event_at",
          r.id as "repost_id",
          r.user_id as "reposter_id"
        FROM reposts r
        JOIN posts p ON r.post_id = p.id
        WHERE p.is_published = true AND p.archived_at IS NULL ${visibilityPart} ${tagPart} ${pendingFilter} ${seriesFilter}
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

      // Attach first series this post belongs to (if any)
      const seriesPost = (post as any).seriesPosts?.[0];
      (mapped as any).series = seriesPost?.series ?? null;

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
    const where: any = {
      ...baseWhere,
      ...visibilityFilter,
      ...(tag ? { tags: { has: tag } } : {}),
      AND: seriesVisibilityAnd(userId ?? null),
    };
    const posts = await this.prisma.post.findMany({
      where,
      take: limit * 2,
      skip: offset,
      include: postInclude(userId ?? null),
    });
    const sorted = posts
      .sort((a, b) => {
        const scoreA = ((a as any)._count?.likes ?? 0) * 2 + ((a as any)._count?.comments ?? 0);
        const scoreB = ((b as any)._count?.likes ?? 0) * 2 + ((b as any)._count?.comments ?? 0);
        return scoreB - scoreA;
      })
      .slice(0, limit);
    return sorted.map(p => {
      const mapped = mapPost(p, userId) as any;
      const seriesPost = (p as any).seriesPosts?.[0];
      mapped.series = seriesPost?.series ?? null;
      return mapped;
    });
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
    const trendingWhere: any = {
      ...baseWhere,
      ...visibilityFilter,
      AND: seriesVisibilityAnd(userId ?? null),
    };
    const posts = await this.prisma.post.findMany({
      where: trendingWhere,
      take: 50,
      include: postInclude(userId ?? null),
    });
    return posts
      .sort((a, b) => {
        const scoreA = ((a as any)._count?.likes ?? 0) * 2 + ((a as any)._count?.comments ?? 0);
        const scoreB = ((b as any)._count?.likes ?? 0) * 2 + ((b as any)._count?.comments ?? 0);
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }
}
