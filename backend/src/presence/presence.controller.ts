import { Controller, Get, Header } from '@nestjs/common';
import { PresenceService } from './presence.service';
import { Public } from '../auth/public.decorator';

@Controller('presence')
export class PresenceController {
  constructor(private readonly presence: PresenceService) { }

  @Public()
  @Header('Cache-Control', 'no-store') // Disables caching for this endpoint
  @Get('online-count')
  getOnlineCount() {
    const onlineCount = this.presence.getOnlineCount();
    console.log(`[PresenceController] Fetching online count: ${onlineCount}`); // Instrumentation log
    return { count: onlineCount };
  }
}
