import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { Public } from '../auth/public.decorator';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Public()
  @Get('posts')
  searchPosts(
    @Query('q') q?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.searchService.searchPosts(
      q ?? '',
      Number(limit) || 20,
      Number(offset) || 0,
    );
  }

  @Public()
  @Get('users')
  searchUsers(
    @Query('q') q?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.searchService.searchUsers(
      q ?? '',
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
