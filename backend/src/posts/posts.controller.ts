import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
  PayloadTooLargeException,
  Res,
  StreamableFile,
  Header,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { BookmarksService } from '../bookmarks/bookmarks.service';
import { RepostsService } from '../reposts/reposts.service';

/** Max 5 MB per image (reasonable for web; we compress on upload). */
export const MAX_POST_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly bookmarksService: BookmarksService,
    private readonly repostsService: RepostsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: { id: string }, @Body() dto: CreatePostDto) {
    return this.postsService.create(user.id, dto);
  }

  @Post('upload-image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: MAX_POST_IMAGE_SIZE_BYTES },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype || !ALLOWED_IMAGE_MIMES.includes(file.mimetype)) {
          return cb(null, false);
        }
        cb(null, true);
      },
    }),
  )
  uploadImage(
    @CurrentUser() user: { id: string },
    @UploadedFile() file: { buffer: Buffer; mimetype: string; size?: number } | undefined,
  ) {
    if (!file || !file.buffer) {
      throw new BadRequestException('No image file provided');
    }
    if (file.size != null && file.size > MAX_POST_IMAGE_SIZE_BYTES) {
      throw new PayloadTooLargeException('Image must be 5 MB or smaller.');
    }
    return this.postsService.uploadPostImage(user.id, file.buffer, file.mimetype);
  }

  /** Serve post image from DB. Declared before :id so /posts/images/:imageId is matched. */
  @Public()
  @Header('Cache-Control', 'public, max-age=86400')
  @Get('images/:imageId')
  async getPostImage(@Param('imageId') imageId: string): Promise<StreamableFile> {
    const image = await this.postsService.getPostImage(imageId);
    if (!image) throw new NotFoundException('Image not found');
    return new StreamableFile(image.buffer, { type: image.mimeType });
  }

  @Public()
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  findAll(
    @CurrentUser() user: { id: string; isSuperadmin?: boolean } | null,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('author') author?: string,
  ) {
    const userId = user?.id ?? null;
    const isSuperadmin = !!user?.isSuperadmin;
    if (author) {
      return this.postsService.findByAuthor(author, Number(limit) || 20, Number(offset) || 0, userId);
    }
    return this.postsService.findAll(Number(limit) || 20, Number(offset) || 0, userId, isSuperadmin);
  }

  @Public()
  @Get(':id/export')
  @UseGuards(OptionalJwtAuthGuard)
  async export(
    @Param('id') id: string,
    @Query('format') format: string,
    @CurrentUser() user: { id: string; isSuperadmin?: boolean } | null,
    @Res() res: Response,
  ) {
    const fmt = (format || 'html').toLowerCase();
    if (fmt !== 'html' && fmt !== 'docx') throw new BadRequestException('Format must be html or docx');
    const result = await this.postsService.export(id, fmt, user?.id ?? null, !!user?.isSuperadmin);
    const ext = result.format === 'docx' ? 'docx' : 'html';
    const mime = result.format === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'text/html';
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}.${ext}"`);
    res.setHeader('Content-Type', mime);
    res.send(result.buffer);
  }

  @Get('archived')
  @UseGuards(JwtAuthGuard)
  findArchived(
    @CurrentUser() user: { id: string },
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.postsService.findArchivedByUser(user.id, Number(limit) || 50, Number(offset) || 0);
  }

  @Post(':id/bookmarks')
  @UseGuards(JwtAuthGuard)
  toggleBookmark(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.bookmarksService.toggle(id, user.id);
  }

  @Get(':id/bookmarks/me')
  @UseGuards(JwtAuthGuard)
  async bookmarkMe(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    const bookmarked = await this.bookmarksService.userHasBookmark(id, user.id);
    return { bookmarked };
  }

  @Post(':id/reposts')
  @UseGuards(JwtAuthGuard)
  toggleRepost(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.repostsService.toggle(id, user.id);
  }

  @Get(':id/reposts/me')
  @UseGuards(JwtAuthGuard)
  async repostMe(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    const reposted = await this.repostsService.userReposted(id, user.id);
    return { reposted };
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  findOne(@Param('id') id: string, @CurrentUser() user?: { id: string; isSuperadmin?: boolean } | null) {
    return this.postsService.findOnePublic(id, user?.id, !!user?.isSuperadmin);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @CurrentUser() user: { id: string }, @Body() dto: UpdatePostDto) {
    return this.postsService.update(id, user.id, dto);
  }

  @Post(':id/archive')
  @UseGuards(JwtAuthGuard)
  archive(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.postsService.archive(id, user.id);
  }

  @Post(':id/unarchive')
  @UseGuards(JwtAuthGuard)
  unarchive(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.postsService.unarchive(id, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @CurrentUser() user: { id: string; isSuperadmin?: boolean }) {
    return this.postsService.remove(id, user.id, !!user.isSuperadmin);
  }
}
