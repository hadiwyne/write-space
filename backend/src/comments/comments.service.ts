import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { NotificationsService } from '../notifications/notifications.service';

const authorSelect = { id: true, username: true, displayName: true, avatarUrl: true, avatarShape: true, avatarFrame: true, badgeUrl: true };

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
      include: { author: { select: authorSelect }, reactions: { select: { type: true, userId: true } } },
    });
    const withCounts = this.attachReactionCounts([comment], authorId)[0];

    await this.notifications.create({
      userId: post.authorId,
      type: parentId ? 'COMMENT_REPLY' : 'COMMENT',
      actorId: authorId,
      postId,
      commentId: withCounts.id,
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
          commentId: withCounts.id,
        });
      }
    }

    return withCounts;
  }

  private attachReactionCounts(
    comments: { id: string; reactions?: { type: string; userId: string }[] }[],
    userId: string | null,
  ) {
    return comments.map((c) => {
      const reactions = c.reactions ?? [];
      const likeCount = reactions.filter((r) => r.type === 'LIKE').length;
      const dislikeCount = reactions.filter((r) => r.type === 'DISLIKE').length;
      const myReaction = userId
        ? (reactions.find((r) => r.userId === userId)?.type as 'LIKE' | 'DISLIKE' | undefined) ?? null
        : null;
      const { reactions: _, ...rest } = c;
      return { ...rest, likeCount, dislikeCount, myReaction };
    });
  }

  async findByPost(postId: string, limit = 200, offset = 0, userId?: string | null) {
    const all = await this.prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      take: limit,
      skip: offset,
      include: {
        author: { select: authorSelect },
        reactions: { select: { type: true, userId: true } },
      },
    });
    const withCounts = this.attachReactionCounts(
      all as { id: string; reactions?: { type: string; userId: string }[] }[],
      userId ?? null,
    );
    return this.buildCommentTree(withCounts as unknown as { id: string; parentId: string | null; createdAt: unknown; [k: string]: unknown }[], null);
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

  async setReaction(commentId: string, userId: string, type: 'LIKE' | 'DISLIKE') {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    const existing = await this.prisma.commentReaction.findUnique({
      where: { commentId_userId: { commentId, userId } },
    });
    if (existing) {
      if (existing.type === type) {
        await this.prisma.commentReaction.delete({
          where: { id: existing.id },
        });
      } else {
        await this.prisma.commentReaction.update({
          where: { id: existing.id },
          data: { type },
        });
      }
    } else {
      await this.prisma.commentReaction.create({
        data: { commentId, userId, type },
      });
    }
    return this.getCommentReactionSummary(commentId, userId);
  }

  private async getCommentReactionSummary(commentId: string, userId: string | null) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: { reactions: { select: { type: true, userId: true } } },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    const reactions = (comment as { reactions: { type: string; userId: string }[] }).reactions ?? [];
    const likeCount = reactions.filter((r) => r.type === 'LIKE').length;
    const dislikeCount = reactions.filter((r) => r.type === 'DISLIKE').length;
    const myReaction = userId
      ? (reactions.find((r) => r.userId === userId)?.type as 'LIKE' | 'DISLIKE' | undefined) ?? null
      : null;
    return { likeCount, dislikeCount, myReaction };
  }

  async update(id: string, userId: string, dto: UpdateCommentDto) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.authorId !== userId) throw new ForbiddenException('Not your comment');
    const updated = await this.prisma.comment.update({
      where: { id },
      data: { content: dto.content, editedAt: new Date() },
      include: { author: { select: authorSelect }, reactions: { select: { type: true, userId: true } } },
    });
    return this.attachReactionCounts([updated], userId)[0];
  }

  async remove(id: string, userId: string, isSuperadmin = false) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (!isSuperadmin && comment.authorId !== userId) throw new ForbiddenException('Not your comment');
    await this.prisma.comment.delete({ where: { id } });
    return { deleted: true };
  }
}
