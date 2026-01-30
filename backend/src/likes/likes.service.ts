import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LikesService {
  constructor(private prisma: PrismaService) {}

  async toggle(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    const existing = await this.prisma.like.findUnique({
      where: { postId_userId: { postId, userId } },
    });
    if (existing) {
      await this.prisma.like.delete({ where: { id: existing.id } });
      return { liked: false, count: post.viewCount };
    }
    await this.prisma.like.create({ data: { postId, userId } });
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
