import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { FollowService } from './follow.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { RepostsModule } from '../reposts/reposts.module';
import { LikesModule } from '../likes/likes.module';

@Module({
  imports: [NotificationsModule, RepostsModule, LikesModule],
  providers: [UsersService, FollowService],
  controllers: [UsersController],
  exports: [UsersService, FollowService],
})
export class UsersModule {}
