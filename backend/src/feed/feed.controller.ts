import { Controller, Get, Query } from '@nestjs/common';
import { FeedService } from './feed.service';
import { Public } from '../auth/public.decorator';

@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Public()
  @Get()
  getFeed(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    return this.feedService.getChronological(null, Number(limit) || 20, Number(offset) || 0);
  }
}
