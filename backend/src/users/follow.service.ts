import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class FollowService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async isFollowing(followerId: string, username: string): Promise<boolean> {
    const target = await this.prisma.user.findUnique({ where: { username }, select: { id: true, isSuperadmin: true } });
    if (!target) throw new NotFoundException('User not found');
    if ((target as { isSuperadmin?: boolean }).isSuperadmin && target.id !== followerId) throw new NotFoundException('User not found');
    if (target.id === followerId) return false;
    const follow = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId: target.id } },
    });
    return !!follow;
  }

  /** Returns { following, requested } for display (e.g. "Follow" | "Following" | "Requested"). */
  async getFollowStatus(followerId: string, username: string): Promise<{ following: boolean; requested: boolean }> {
    const target = await this.prisma.user.findUnique({ where: { username }, select: { id: true, isSuperadmin: true } });
    if (!target) throw new NotFoundException('User not found');
    if ((target as { isSuperadmin?: boolean }).isSuperadmin && target.id !== followerId) throw new NotFoundException('User not found');
    if (target.id === followerId) return { following: false, requested: false };
    const follow = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId: target.id } },
    });
    if (follow) return { following: true, requested: false };
    const request = await this.prisma.followRequest.findUnique({
      where: { fromUserId_toUserId: { fromUserId: followerId, toUserId: target.id } },
    });
    return { following: false, requested: !!request && request.status === 'PENDING' };
  }

  async follow(followerId: string, username: string) {
    const target = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true, isSuperadmin: true },
    });
    if (!target) throw new NotFoundException('User not found');
    if ((target as { isSuperadmin?: boolean }).isSuperadmin) throw new NotFoundException('User not found');
    if (target.id === followerId) throw new BadRequestException('You cannot follow yourself');

    const settings = await this.prisma.user.findUnique({
      where: { id: target.id },
      select: { whoCanFollowMe: true },
    });
    const raw = (settings as { whoCanFollowMe?: string } | null)?.whoCanFollowMe;
    const whoCanFollowMe = typeof raw === 'string' ? raw.trim().toUpperCase() : null;
    const allowDirectFollow = whoCanFollowMe === 'PUBLIC';

    if (allowDirectFollow) {
      await this.prisma.follow.upsert({
        where: { followerId_followingId: { followerId, followingId: target.id } },
        create: { followerId, followingId: target.id },
        update: {},
      });
      await this.notifications.create({
        userId: target.id,
        type: 'FOLLOW',
        actorId: followerId,
      });
      return { following: true };
    }

    // APPROVAL or any other value: require follow request
    const existing = await this.prisma.followRequest.findUnique({
      where: { fromUserId_toUserId: { fromUserId: followerId, toUserId: target.id } },
    });
    if (existing) {
      if (existing.status === 'PENDING') return { requested: true };
      if (existing.status === 'APPROVED') {
        await this.prisma.follow.upsert({
          where: { followerId_followingId: { followerId, followingId: target.id } },
          create: { followerId, followingId: target.id },
          update: {},
        });
        return { following: true };
      }
    }
    await this.prisma.followRequest.upsert({
      where: { fromUserId_toUserId: { fromUserId: followerId, toUserId: target.id } },
      create: { fromUserId: followerId, toUserId: target.id, status: 'PENDING' },
      update: { status: 'PENDING' },
    });
    await this.notifications.create({
      userId: target.id,
      type: 'FOLLOW_REQUEST',
      actorId: followerId,
    });
    return { requested: true };
  }

  async unfollow(followerId: string, username: string) {
    const target = await this.prisma.user.findUnique({ where: { username }, select: { id: true, isSuperadmin: true } });
    if (!target) throw new NotFoundException('User not found');
    if ((target as { isSuperadmin?: boolean }).isSuperadmin) throw new NotFoundException('User not found');
    await this.prisma.follow.deleteMany({
      where: { followerId, followingId: target.id },
    });
    // So they must send a new follow request next time (approval is not permanent after unfollow)
    await this.prisma.followRequest.updateMany({
      where: { fromUserId: followerId, toUserId: target.id, status: 'APPROVED' },
      data: { status: 'DENIED' },
    });
    return { following: false };
  }

  async getFollowers(username: string, limit = 50, offset = 0, viewerId?: string | null) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true, whoCanSeeFollowers: true },
    });
    if (!user) throw new NotFoundException('User not found');
    const who = (user as { whoCanSeeFollowers?: string }).whoCanSeeFollowers ?? 'PUBLIC';
    if (who === 'NO_ONE' && viewerId !== user.id) return [];
    if (who === 'FOLLOWERS' && viewerId !== user.id) {
      if (!viewerId) return [];
      const isFollower = await this.prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: viewerId, followingId: user.id } },
      });
      if (!isFollower) return [];
    }
    const follows = await this.prisma.follow.findMany({
      where: { followingId: user.id, follower: { isSuperadmin: false } },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: {
        follower: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, avatarShape: true, avatarFrame: true, badgeUrl: true },
        },
      },
    });
    return follows.map((f) => f.follower);
  }

  async getFollowing(username: string, limit = 50, offset = 0, viewerId?: string | null) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true, whoCanSeeFollowing: true },
    });
    if (!user) throw new NotFoundException('User not found');
    const who = (user as { whoCanSeeFollowing?: string }).whoCanSeeFollowing ?? 'PUBLIC';
    if (who === 'NO_ONE' && viewerId !== user.id) return [];
    if (who === 'FOLLOWERS' && viewerId !== user.id) {
      if (!viewerId) return [];
      const isFollower = await this.prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: viewerId, followingId: user.id } },
      });
      if (!isFollower) return [];
    }
    const follows = await this.prisma.follow.findMany({
      where: { followerId: user.id, following: { isSuperadmin: false } },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: {
        following: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, avatarShape: true, avatarFrame: true, badgeUrl: true },
        },
      },
    });
    return follows.map((f) => f.following);
  }

  /** Remove a user from my followers (so they no longer follow me). Caller must be the profile user. */
  async removeFollower(profileUserId: string, followerUserId: string) {
    await this.prisma.follow.deleteMany({
      where: { followingId: profileUserId, followerId: followerUserId },
    });
    // So they must send a new follow request next time (approval is not permanent after removal)
    await this.prisma.followRequest.updateMany({
      where: { fromUserId: followerUserId, toUserId: profileUserId, status: 'APPROVED' },
      data: { status: 'DENIED' },
    });
    return { removed: true };
  }

  async listPendingFollowRequests(toUserId: string) {
    const list = await this.prisma.followRequest.findMany({
      where: { toUserId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      include: {
        fromUser: { select: { id: true, username: true, displayName: true, avatarUrl: true, avatarShape: true, avatarFrame: true, badgeUrl: true } },
      },
    });
    return list.map((r) => ({ ...r.fromUser, requestedAt: r.createdAt }));
  }

  async approveFollowRequest(toUserId: string, fromUserId: string) {
    const req = await this.prisma.followRequest.findUnique({
      where: { fromUserId_toUserId: { fromUserId, toUserId } },
    });
    if (!req || req.status !== 'PENDING') throw new NotFoundException('Follow request not found');
    await this.prisma.$transaction([
      this.prisma.followRequest.update({
        where: { id: req.id },
        data: { status: 'APPROVED' },
      }),
      this.prisma.follow.upsert({
        where: { followerId_followingId: { followerId: fromUserId, followingId: toUserId } },
        create: { followerId: fromUserId, followingId: toUserId },
        update: {},
      }),
    ]);
    await this.notifications.create({ userId: fromUserId, type: 'FOLLOW', actorId: toUserId });
    return { approved: true };
  }

  async denyFollowRequest(toUserId: string, fromUserId: string) {
    const req = await this.prisma.followRequest.findUnique({
      where: { fromUserId_toUserId: { fromUserId, toUserId } },
    });
    if (!req || req.status !== 'PENDING') throw new NotFoundException('Follow request not found');
    await this.prisma.followRequest.update({
      where: { id: req.id },
      data: { status: 'DENIED' },
    });
    return { denied: true };
  }
}
