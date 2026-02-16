import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CommentsService, CommentWithReplies } from './comments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Controller('posts/:postId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Param('postId') postId: string, @CurrentUser() user: { id: string }, @Body() dto: CreateCommentDto) {
    return this.commentsService.create(postId, user.id, dto);
  }

  @Public()
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  findByPost(
    @Param('postId') postId: string,
    @CurrentUser() user?: { id: string } | null,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<CommentWithReplies[]> {
    return this.commentsService.findByPost(postId, Number(limit) || 50, Number(offset) || 0, user?.id ?? null);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @CurrentUser() user: { id: string }, @Body() dto: UpdateCommentDto) {
    return this.commentsService.update(id, user.id, dto);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  like(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.commentsService.setReaction(id, user.id, 'LIKE');
  }

  @Post(':id/dislike')
  @UseGuards(JwtAuthGuard)
  dislike(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.commentsService.setReaction(id, user.id, 'DISLIKE');
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @CurrentUser() user: { id: string; isSuperadmin?: boolean }) {
    return this.commentsService.remove(id, user.id, !!user.isSuperadmin);
  }
}
