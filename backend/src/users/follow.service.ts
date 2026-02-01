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
    const target = await this.prisma.user.findUnique({ where: { username } });
    if (!target) throw new NotFoundException('User not found');
    if (target.id === followerId) return false; // can't "follow" yourself
    const follow = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId: target.id } },
    });
    return !!follow;
  }

  async follow(followerId: string, username: string) {
    const target = await this.prisma.user.findUnique({ where: { username } });
    if (!target) throw new NotFoundException('User not found');
    if (target.id === followerId) throw new BadRequestException('You cannot follow yourself');
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

  async unfollow(followerId: string, username: string) {
    const target = await this.prisma.user.findUnique({ where: { username } });
    if (!target) throw new NotFoundException('User not found');
    await this.prisma.follow.deleteMany({
      where: { followerId, followingId: target.id },
    });
    return { following: false };
  }

  async getFollowers(username: string, limit = 50, offset = 0) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) throw new NotFoundException('User not found');
    const follows = await this.prisma.follow.findMany({
      where: { followingId: user.id },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: {
        follower: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });
    return follows.map((f) => f.follower);
  }

  async getFollowing(username: string, limit = 50, offset = 0) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) throw new NotFoundException('User not found');
    const follows = await this.prisma.follow.findMany({
      where: { followerId: user.id },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: {
        following: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
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
    return { removed: true };
  }
}
