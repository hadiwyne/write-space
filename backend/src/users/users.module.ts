import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { FollowService } from './follow.service';

@Module({
  providers: [UsersService, FollowService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
