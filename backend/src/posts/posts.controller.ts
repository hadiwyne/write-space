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
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { VotePollDto } from './dto/vote-poll.dto';
import { AddPollOptionDto } from './dto/add-poll-option.dto';
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
    private readonly config: ConfigService,
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
    @Query('tab') tab?: string,
  ) {
    const userId = user?.id ?? null;
    const isSuperadmin = !!user?.isSuperadmin;
    if (author) {
      const tabMode = tab === 'anonymous' ? ('anonymous' as const) : undefined;
      return this.postsService.findByAuthor(author, Number(limit) || 20, Number(offset) || 0, userId, tabMode);
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
    const fmt = (format || 'pdf').toLowerCase();
    if (fmt !== 'pdf' && fmt !== 'docx') throw new BadRequestException('Format must be pdf or docx');
    const result = await this.postsService.export(id, fmt, user?.id ?? null, !!user?.isSuperadmin);
    const ext = result.format;
    const mime = result.format === 'docx'
      ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      : 'application/pdf';
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


  @Post(':id/reposts')
  @UseGuards(JwtAuthGuard)
  toggleRepost(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.repostsService.toggle(id, user.id);
  }


  @Post(':id/poll/vote')
  @UseGuards(JwtAuthGuard)
  votePoll(@Param('id') id: string, @CurrentUser() user: { id: string }, @Body() dto: VotePollDto) {
    return this.postsService.votePoll(id, user.id, dto.optionId);
  }

  @Post(':id/poll/options')
  @UseGuards(JwtAuthGuard)
  addPollOption(@Param('id') id: string, @CurrentUser() user: { id: string }, @Body() dto: AddPollOptionDto) {
    return this.postsService.addPollOption(id, user.id, dto.text);
  }

  @Get(':id/poll/voters')
  @UseGuards(JwtAuthGuard)
  getPollVoters(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.postsService.getPollVoters(id, user.id);
  }

  @Public()
  @Get(':id/poll')
  @UseGuards(OptionalJwtAuthGuard)
  getPostPoll(@Param('id') id: string, @CurrentUser() user?: { id: string } | null) {
    return this.postsService.getPollForPost(id, user?.id ?? null);
  }

  /**
   * Social-media meta endpoint. Returns a tiny HTML page with Open Graph and
   * Twitter Card tags pre-rendered so crawlers (Facebook, Twitter, etc.) can
   * read the post's title and thumbnail without executing JavaScript.
   * Netlify's bot-conditional redirect in netlify.toml sends crawler requests here.
   */
  @Public()
  @Get(':id/meta')
  async getMeta(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const post = await this.postsService.getMetaForCrawlers(id);

    if (!post) {
      res.status(404).send('Not found');
      return;
    }

    const appUrl = (this.config.get<string>('APP_PUBLIC_URL') || 'https://writespace.netlify.app').replace(/\/$/, '');
    const postUrl = `${appUrl}/posts/${id}`;
    const title = this.escapeHtml(post.title);
    const description = this.escapeHtml(post.excerpt);
    const image = this.escapeHtml(post.imageUrl || '');
    const siteName = 'WriteSpace';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${title} — ${siteName}</title>
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="${siteName}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:url" content="${postUrl}" />${description ? `\n  <meta property="og:description" content="${description}" />` : ''}${image ? `\n  <meta property="og:image" content="${image}" />\n  <meta property="og:image:width" content="1200" />\n  <meta property="og:image:height" content="630" />` : ''}
  <meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />
  <meta name="twitter:title" content="${title}" />${description ? `\n  <meta name="twitter:description" content="${description}" />` : ''}${image ? `\n  <meta name="twitter:image" content="${image}" />` : ''}
  <meta http-equiv="refresh" content="0; url=${postUrl}" />
</head>
<body>
  <p>Redirecting to <a href="${postUrl}">${title}</a>…</p>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.status(200).send(html);
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
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
