import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { mapPost } from '../utils/response.utils';

@Injectable()
export class LikesService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) { }

  private postInclude(userId?: string | null) {
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

  async toggle(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    const existing = await this.prisma.like.findUnique({
      where: { postId_userId: { postId, userId } },
    });
    if (existing) {
      await this.prisma.like.delete({ where: { id: existing.id } });
      const count = await this.prisma.like.count({ where: { postId } });
      return { liked: false, count };
    }
    await this.prisma.like.create({ data: { postId, userId } });
    await this.notifications.create({
      userId: post.authorId,
      type: 'LIKE',
      actorId: userId,
      postId,
    });
    const count = await this.prisma.like.count({ where: { postId } });
    return { liked: true, count };
  }

  async count(postId: string) {
    return this.prisma.like.count({ where: { postId } });
  }

  async userLiked(postId: string, userId: string): Promise<boolean> {
    const like = await this.prisma.like.findUnique({
      where: { postId_userId: { postId, userId } },
    });
    return !!like;
  }

  /** Returns liked posts for a user. Respects whoCanSeeLikes: NO_ONE (empty), FOLLOWERS (viewer must follow), PUBLIC. */
  async findByUser(username: string, limit = 50, offset = 0, viewerId?: string | null) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true, whoCanSeeLikes: true },
    });
    if (!user) throw new NotFoundException('User not found');
    const who = (user as { whoCanSeeLikes?: string }).whoCanSeeLikes ?? 'PUBLIC';
    if (who === 'NO_ONE' && viewerId !== user.id) return [];
    if (who === 'FOLLOWERS' && viewerId !== user.id) {
      if (!viewerId) return [];
      const isFollower = await this.prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: viewerId, followingId: user.id } },
      });
      if (!isFollower) return [];
    }
    const items = await this.prisma.like.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        post: {
          include: this.postInclude(viewerId),
        },
      },
    });
    return items.map((l) => mapPost(l.post, viewerId));
  }
}
