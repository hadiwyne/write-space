import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async searchPosts(q: string, limit = 20, offset = 0) {
    const term = q.trim();
    const tagMatch = term.startsWith('#') ? term.slice(1).trim().toLowerCase() : null;

    if (tagMatch) {
      return this.prisma.post.findMany({
        where: {
          isPublished: true,
          archivedAt: null,
          visibility: 'PUBLIC' as const,
          tags: { has: tagMatch },
        },
        orderBy: { publishedAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          author: { select: { id: true, username: true, displayName: true, avatarUrl: true, avatarShape: true, avatarFrame: true, badgeUrl: true } },
          _count: { select: { likes: true, comments: true } },
        },
      });
    }

    if (!term) return [];

    return this.prisma.post.findMany({
      where: {
        isPublished: true,
        archivedAt: null,
        visibility: 'PUBLIC' as const,
        OR: [
          { title: { contains: term, mode: 'insensitive' } },
          { content: { contains: term, mode: 'insensitive' } },
        ],
      },
      orderBy: { publishedAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        author: { select: { id: true, username: true, displayName: true, avatarUrl: true, avatarShape: true, avatarFrame: true, badgeUrl: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });
  }

  async getTrendingTags(limit = 10): Promise<{ tag: string; count: number }[]> {
    const posts = await this.prisma.post.findMany({
      where: { isPublished: true, archivedAt: null, visibility: 'PUBLIC' as const },
      select: { tags: true },
      take: 5000,
    });
    const countByTag = new Map<string, number>();
    for (const p of posts) {
      for (const tag of p.tags) {
        const t = tag.trim().toLowerCase();
        if (t) countByTag.set(t, (countByTag.get(t) ?? 0) + 1);
      }
    }
    return Array.from(countByTag.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tag, count]) => ({ tag, count }));
  }

  async searchUsers(q: string, limit = 20, offset = 0) {
    const term = q.trim();
    if (!term) return [];

    return this.prisma.user.findMany({
      where: {
        isSuperadmin: false,
        OR: [
          { username: { contains: term, mode: 'insensitive' } },
          { displayName: { contains: term, mode: 'insensitive' } },
        ],
      },
      take: limit,
      skip: offset,
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
avatarShape: true,
    avatarFrame: true,
    badgeUrl: true,
        bio: true,
        _count: { select: { posts: true, followers: true, following: true } },
      },
    });
  }
}
