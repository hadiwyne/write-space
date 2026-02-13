import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { NotificationsService } from '../notifications/notifications.service';

const authorSelect = { id: true, username: true, displayName: true, avatarUrl: true, avatarShape: true };

export type CommentWithReplies = {
  id: string;
  parentId: string | null;
  createdAt: string;
  [k: string]: unknown;
  replies: CommentWithReplies[];
};

@Injectable()
export class CommentsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(postId: string, authorId: string, dto: CreateCommentDto) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    let parentId: string | null = null;
    if (dto.parentId) {
      const parent = await this.prisma.comment.findUnique({
        where: { id: dto.parentId },
        select: { postId: true },
      });
      if (!parent || parent.postId !== postId) throw new BadRequestException('Invalid parent comment');
      parentId = dto.parentId;
    }

    const comment = await this.prisma.comment.create({
      data: { postId, authorId, content: dto.content, parentId },
      include: { author: { select: authorSelect } },
    });

    await this.notifications.create({
      userId: post.authorId,
      type: parentId ? 'COMMENT_REPLY' : 'COMMENT',
      actorId: authorId,
      postId,
      commentId: comment.id,
    });
    if (parentId) {
      const parent = await this.prisma.comment.findUnique({
        where: { id: parentId },
        select: { authorId: true },
      });
      if (parent && parent.authorId !== post.authorId) {
        await this.notifications.create({
          userId: parent.authorId,
          type: 'COMMENT_REPLY',
          actorId: authorId,
          postId,
          commentId: comment.id,
        });
      }
    }

    return comment;
  }

  async findByPost(postId: string, limit = 200, offset = 0) {
    const all = await this.prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      take: limit,
      skip: offset,
      include: { author: { select: authorSelect } },
    });
    return this.buildCommentTree(all, null);
  }

  private buildCommentTree(
    comments: { id: string; parentId: string | null; createdAt: unknown; [k: string]: unknown }[],
    parentId: string | null,
  ): CommentWithReplies[] {
    return comments
      .filter((c) => c.parentId === parentId)
      .map((c) => ({
        ...c,
        createdAt: c.createdAt as string,
        replies: this.buildCommentTree(comments, c.id),
      }))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async update(id: string, userId: string, dto: UpdateCommentDto) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.authorId !== userId) throw new ForbiddenException('Not your comment');
    return this.prisma.comment.update({
      where: { id },
      data: { content: dto.content },
      include: { author: { select: { id: true, username: true, displayName: true, avatarUrl: true, avatarShape: true } } },
    });
  }

  async remove(id: string, userId: string, isSuperadmin = false) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (!isSuperadmin && comment.authorId !== userId) throw new ForbiddenException('Not your comment');
    await this.prisma.comment.delete({ where: { id } });
    return { deleted: true };
  }
}
