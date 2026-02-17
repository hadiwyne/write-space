import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { Public } from '../auth/public.decorator';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) { }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get('posts')
  searchPosts(
    @CurrentUser() user: { id: string } | null,
    @Query('q') q?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.searchService.searchPosts(
      q ?? '',
      user?.id ?? null,
      Number(limit) || 20,
      Number(offset) || 0,
    );
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get('users')
  searchUsers(
    @CurrentUser() user: { id: string } | null,
    @Query('q') q?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.searchService.searchUsers(
      q ?? '',
      user?.id ?? null,
      Number(limit) || 20,
      Number(offset) || 0,
    );
  }

  @Public()
  @Get('trending-tags')
  getTrendingTags(@Query('limit') limit?: string) {
    return this.searchService.getTrendingTags(Number(limit) || 10);
  }
}
