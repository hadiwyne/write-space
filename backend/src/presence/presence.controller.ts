import { Controller, Get } from '@nestjs/common';
import { PresenceService } from './presence.service';
import { Public } from '../auth/public.decorator';

@Controller('presence')
export class PresenceController {
  constructor(private readonly presence: PresenceService) {}

  @Public()
  @Get('online-count')
  getOnlineCount() {
    return { count: this.presence.getOnlineCount() };
  }
}
