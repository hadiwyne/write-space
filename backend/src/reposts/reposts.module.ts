import { Module } from '@nestjs/common';
import { RepostsService } from './reposts.service';

@Module({
  providers: [RepostsService],
  exports: [RepostsService],
})
export class RepostsModule {}
