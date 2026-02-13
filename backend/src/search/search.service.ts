import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async searchPosts(q: string, limit = 20, offset = 0) {
    const term = q.trim();
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
        author: { select: { id: true, username: true, displayName: true, avatarUrl: true, avatarShape: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });
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
        bio: true,
        _count: { select: { posts: true, followers: true, following: true } },
      },
    });
  }
}
