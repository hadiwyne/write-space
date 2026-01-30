import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { LikesService } from './likes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';

@Controller('posts/:postId/likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  toggle(@Param('postId') postId: string, @CurrentUser() user: { id: string }) {
    return this.likesService.toggle(postId, user.id);
  }

  @Public()
  @Get('count')
  count(@Param('postId') postId: string) {
    return this.likesService.count(postId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Param('postId') postId: string, @CurrentUser() user: { id: string }) {
    const liked = await this.likesService.userLiked(postId, user.id);
    return { liked };
  }
}
