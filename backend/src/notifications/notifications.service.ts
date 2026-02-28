import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';
import { mapUser } from '../utils/response.utils';

export type NotificationType = 'LIKE' | 'COMMENT' | 'COMMENT_REPLY' | 'FOLLOW' | 'FOLLOW_REQUEST' | 'MENTION';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private gateway: NotificationsGateway,
  ) { }

  async create(data: {
    userId: string;
    type: NotificationType;
    actorId?: string;
    actorAnonymousAlias?: string | null;
    postId?: string;
    commentId?: string;
  }) {
    if (data.actorId && data.actorId === data.userId) return null;
    const notification = await this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        actorId: data.actorId,
        actorAnonymousAlias: data.actorAnonymousAlias ?? undefined,
        postId: data.postId,
        commentId: data.commentId,
      },
      include: {
        actor: { select: { id: true, username: true, displayName: true, avatarUrl: true, avatarShape: true, avatarFrame: true, badgeUrl: true, profileHTML: true, bio: true, whoCanSeeLikes: true, whoCanSeeFollowing: true, whoCanSeeFollowers: true, whoCanFollowMe: true, _count: { select: { followers: true, following: true } } } },
        post: { select: { id: true, title: true } },
      },
    });
    const out = this.maskNotificationActor(notification as any, data.userId);
    this.gateway.emitToUser(data.userId, 'notification', out);
    return out;
  }

  private maskNotificationActor(n: { actor?: any; actorAnonymousAlias?: string | null; postId?: string | null }, userId?: string): any {
    if (n.actorAnonymousAlias) {
      return {
        ...n,
        actor: { displayName: n.actorAnonymousAlias, username: null, avatarUrl: null, avatarShape: null, avatarFrame: null, badgeUrl: null },
        isAnonymousActor: true,
      };
    }
    if (n.actor && userId != null) {
      (n as any).actor = mapUser(n.actor, userId);
    }
    return n;
  }

  async findByUser(userId: string, limit = 20, offset = 0, unreadOnly = false) {
    const where: { userId: string; readAt?: null } = { userId };
    if (unreadOnly) where.readAt = null;

    const list = await this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        actor: { select: { id: true, username: true, displayName: true, avatarUrl: true, avatarShape: true, avatarFrame: true, badgeUrl: true, profileHTML: true, bio: true, whoCanSeeLikes: true, whoCanSeeFollowing: true, whoCanSeeFollowers: true, whoCanFollowMe: true, _count: { select: { followers: true, following: true } } } },
        post: { select: { id: true, title: true } },
      },
    });
    return list.map((n) => {
      const mapped = n as any;
      if (mapped.actorAnonymousAlias) {
        mapped.actor = { displayName: mapped.actorAnonymousAlias, username: null, avatarUrl: null, avatarShape: null, avatarFrame: null, badgeUrl: null };
        mapped.isAnonymousActor = true;
      } else if (mapped.actor) {
        mapped.actor = mapUser(mapped.actor, userId);
      }
      return mapped;
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, readAt: null },
    });
  }

  async markRead(id: string, userId: string) {
    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { readAt: new Date() },
    });
    return { read: true };
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { read: true };
  }
}
