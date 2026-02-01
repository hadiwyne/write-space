import { Controller, Post, Get, Param, Query, UseGuards } from '@nestjs/common';
import { RepostsService } from './reposts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';

@Controller()
export class RepostsController {
  constructor(private readonly repostsService: RepostsService) {}

  @Post('posts/:postId/reposts')
  @UseGuards(JwtAuthGuard)
  toggle(@Param('postId') postId: string, @CurrentUser() user: { id: string }) {
    return this.repostsService.toggle(postId, user.id);
  }

  @Get('posts/:postId/reposts/me')
  @UseGuards(JwtAuthGuard)
  async me(@Param('postId') postId: string, @CurrentUser() user: { id: string }) {
    const reposted = await this.repostsService.userReposted(postId, user.id);
    return { reposted };
  }
}
