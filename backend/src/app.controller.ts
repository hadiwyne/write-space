import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get()
  getRoot() {
    return {
      message: 'WriteSpace API',
      status: 'ok',
      usage: 'Use this Space URL as your API base (e.g. /auth/login, /posts, /users/me). Set API_PUBLIC_URL to this URL in Space secrets so image URLs (avatars, post images) are absolute and load from cross-origin frontends.',
    };
  }
}
