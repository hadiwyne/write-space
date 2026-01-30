import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { FollowService } from './follow.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Public } from '../auth/public.decorator';

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly followService: FollowService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: { id: string }) {
    return this.usersService.findMe(user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateProfile(@CurrentUser() user: { id: string }, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Post('me/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('avatar', {
      limits: { fileSize: MAX_AVATAR_SIZE },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype || !ALLOWED_MIMES.includes(file.mimetype)) {
          return cb(null, false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadAvatar(
    @CurrentUser() user: { id: string },
    @UploadedFile() file: { buffer: Buffer; mimetype: string; originalname: string } | undefined,
  ) {
    if (!file || !file.buffer) {
      throw new BadRequestException('No image file provided');
    }
    return this.usersService.saveAvatar(user.id, file.buffer, file.mimetype, file.originalname);
  }

  @Get(':username/follow/status')
  @UseGuards(JwtAuthGuard)
  async getFollowStatus(@Param('username') username: string, @CurrentUser() user: { id: string }) {
    const isFollowing = await this.followService.isFollowing(user.id, username);
    return { isFollowing };
  }

  @Post(':username/follow')
  @UseGuards(JwtAuthGuard)
  async follow(@Param('username') username: string, @CurrentUser() user: { id: string }) {
    return this.followService.follow(user.id, username);
  }

  @Delete(':username/follow')
  @UseGuards(JwtAuthGuard)
  async unfollow(@Param('username') username: string, @CurrentUser() user: { id: string }) {
    return this.followService.unfollow(user.id, username);
  }

  @Get(':username/followers')
  @Public()
  getFollowers(@Param('username') username: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    return this.followService.getFollowers(username, Number(limit) || 50, Number(offset) || 0);
  }

  @Get(':username/following')
  @Public()
  getFollowing(@Param('username') username: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    return this.followService.getFollowing(username, Number(limit) || 50, Number(offset) || 0);
  }

  @Delete('me/followers/:userId')
  @UseGuards(JwtAuthGuard)
  async removeFollower(@Param('userId') userId: string, @CurrentUser() user: { id: string }) {
    return this.followService.removeFollower(user.id, userId);
  }

  @Public()
  @Get(':username')
  getByUsername(@Param('username') username: string) {
    return this.usersService.findByUsername(username);
  }
}
