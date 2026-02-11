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
  NotFoundException,
  StreamableFile,
  Header,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { FollowService } from './follow.service';
import { RepostsService } from '../reposts/reposts.service';
import { LikesService } from '../likes/likes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
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
    private readonly repostsService: RepostsService,
    private readonly likesService: LikesService,
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
    return this.usersService.saveAvatar(user.id, file.buffer, file.mimetype);
  }

  /** Serve avatar from DB (for URLs like /users/avatar/:userId). Declared before :username so "avatar" is not matched as username. */
  @Public()
  @Header('Cache-Control', 'public, max-age=86400')
  @Get('avatar/:userId')
  async getAvatar(@Param('userId') userId: string): Promise<StreamableFile> {
    const avatar = await this.usersService.getAvatar(userId);
    if (!avatar) throw new NotFoundException('Avatar not found');
    return new StreamableFile(avatar.buffer, { type: avatar.mimeType });
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
  @Get(':username/reposts')
  getReposts(
    @Param('username') username: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.repostsService.findByUser(username, Number(limit) || 50, Number(offset) || 0);
  }

  @Public()
  @Get(':username/likes')
  getLikedPosts(
    @Param('username') username: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.likesService.findByUser(username, Number(limit) || 50, Number(offset) || 0);
  }

  @Public()
  @Get(':username')
  @UseGuards(OptionalJwtAuthGuard)
  async getByUsername(@Param('username') username: string, @CurrentUser() user: { id: string } | null) {
    const profile = await this.usersService.findByUsername(username, user?.id);
    if (!profile) throw new NotFoundException('User not found');
    return profile;
  }
}
