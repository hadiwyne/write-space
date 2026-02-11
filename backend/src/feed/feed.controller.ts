import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { FeedService } from './feed.service';
import { Public } from '../auth/public.decorator';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Public()
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  getFeed(
    @CurrentUser() user: { id: string; isSuperadmin?: boolean } | null,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('sort') sort?: string,
    @Query('tag') tag?: string,
  ) {
    const lim = Number(limit) || 20;
    const off = Number(offset) || 0;
    const userId = user?.id ?? null;
    const isSuperadmin = !!user?.isSuperadmin;
    if (sort === 'popular') {
      return this.feedService.getPopular(lim, off, tag || undefined, userId, isSuperadmin);
    }
    if (sort === 'friends' && userId) {
      return this.feedService.getFriends(userId, lim, off, tag || undefined);
    }
    if (sort === 'friends') {
      return [];
    }
    return this.feedService.getChronological(userId, lim, off, tag || undefined, isSuperadmin);
  }

  @Public()
  @Get('trending/tags')
  @UseGuards(OptionalJwtAuthGuard)
  getTrendingTags(@CurrentUser() user: { id: string } | null, @Query('limit') limit?: string) {
    return this.feedService.getTrendingTags(Number(limit) || 10, user?.id ?? null);
  }

  @Public()
  @Get('trending/posts')
  @UseGuards(OptionalJwtAuthGuard)
  getTrendingPosts(@CurrentUser() user: { id: string } | null, @Query('limit') limit?: string) {
    return this.feedService.getTrendingPosts(Number(limit) || 5, user?.id ?? null);
  }
}
