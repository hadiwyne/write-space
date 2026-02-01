import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class LikesService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

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
}
