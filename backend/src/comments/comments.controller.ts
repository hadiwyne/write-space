import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CommentsService, CommentWithReplies } from './comments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
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
  findByPost(
    @Param('postId') postId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<CommentWithReplies[]> {
    return this.commentsService.findByPost(postId, Number(limit) || 50, Number(offset) || 0);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @CurrentUser() user: { id: string }, @Body() dto: UpdateCommentDto) {
    return this.commentsService.update(id, user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @CurrentUser() user: { id: string; isSuperadmin?: boolean }) {
    return this.commentsService.remove(id, user.id, !!user.isSuperadmin);
  }
}
