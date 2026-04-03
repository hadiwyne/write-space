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
  StreamableFile,
  Header,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SeriesService } from './series.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';
import { CreateSeriesDto } from './dto/create-series.dto';
import { UpdateSeriesDto } from './dto/update-series.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto, ReorderDto } from './dto/update-section.dto';

const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGE_SIZE = 15 * 1024 * 1024;

@Controller('series')
export class SeriesController {
  constructor(private readonly seriesService: SeriesService) {}

  // ─── CRUD ────────────────────────────────────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateSeriesDto) {
    return this.seriesService.create(user.id, dto);
  }

  @Public()
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  findAll(
    @CurrentUser() user?: { id: string } | null,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('search') search?: string,
  ) {
    return this.seriesService.findAll(user?.id ?? null, Number(limit) || 20, Number(offset) || 0, search);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  findMine(@CurrentUser() user: { id: string }) {
    return this.seriesService.findMine(user.id);
  }

  @Public()
  @Get('user/:username')
  @UseGuards(OptionalJwtAuthGuard)
  findByUser(
    @Param('username') username: string,
    @CurrentUser() viewer?: { id: string } | null,
  ) {
    return this.seriesService.findByUser(username, viewer?.id ?? null);
  }

  @Public()
  @Get(':slug')
  @UseGuards(OptionalJwtAuthGuard)
  findOne(@Param('slug') slug: string, @CurrentUser() user?: { id: string } | null) {
    return this.seriesService.findOne(slug, user?.id ?? null);
  }

  @Patch(':slug')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('slug') slug: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateSeriesDto,
  ) {
    return this.seriesService.update(slug, user.id, dto);
  }

  @Delete(':slug')
  @UseGuards(JwtAuthGuard)
  remove(@Param('slug') slug: string, @CurrentUser() user: { id: string }) {
    return this.seriesService.remove(slug, user.id);
  }

  // ─── Images ──────────────────────────────────────────────────────────────────

  @Post(':slug/images/:type')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: MAX_IMAGE_SIZE },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype || !ALLOWED_IMAGE_MIMES.includes(file.mimetype)) {
          return cb(null, false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadImage(
    @Param('slug') slug: string,
    @Param('type') type: string,
    @CurrentUser() user: { id: string },
    @UploadedFile() file: { buffer: Buffer; mimetype: string } | undefined,
  ) {
    if (!file?.buffer) throw new BadRequestException('No image file provided or unsupported format');
    const validTypes = ['logo', 'wordmark', 'cover', 'social-preview', 'bg-image'];
    if (!validTypes.includes(type)) throw new BadRequestException('Invalid image type');
    return this.seriesService.uploadImage(slug, user.id, type as any, file.buffer, file.mimetype);
  }

  @Public()
  @Get(':slug/images/:type')
  @Header('Cache-Control', 'public, max-age=86400')
  async getImage(
    @Param('slug') slug: string,
    @Param('type') type: string,
  ): Promise<StreamableFile> {
    const validTypes = ['logo', 'wordmark', 'cover', 'social-preview', 'bg-image'];
    if (!validTypes.includes(type)) throw new BadRequestException('Invalid image type');
    const { data, mime } = await this.seriesService.getImage(slug, type as any);
    const { Readable } = await import('stream');
    const stream = Readable.from(data);
    return new StreamableFile(stream, { type: mime });
  }

  @Delete(':slug/images/:type')
  @UseGuards(JwtAuthGuard)
  deleteImage(
    @Param('slug') slug: string,
    @Param('type') type: string,
    @CurrentUser() user: { id: string },
  ) {
    const validTypes = ['logo', 'wordmark', 'cover', 'social-preview', 'bg-image'];
    if (!validTypes.includes(type)) throw new BadRequestException('Invalid image type');
    return this.seriesService.deleteImage(slug, user.id, type as any);
  }

  // ─── Members ─────────────────────────────────────────────────────────────────

  @Public()
  @Get(':slug/members')
  @UseGuards(OptionalJwtAuthGuard)
  getMembers(@Param('slug') slug: string, @CurrentUser() user?: { id: string } | null) {
    return this.seriesService.getMembers(slug, user?.id ?? null);
  }

  @Post(':slug/members/invite')
  @UseGuards(JwtAuthGuard)
  invite(
    @Param('slug') slug: string,
    @CurrentUser() user: { id: string },
    @Body('username') username: string,
    @Body('role') role?: string,
  ) {
    if (!username) throw new BadRequestException('username is required');
    return this.seriesService.inviteByUsername(slug, user.id, username, role ?? 'EDITOR');
  }

  @Get(':slug/invite-link')
  @UseGuards(JwtAuthGuard)
  getInviteLink(
    @Param('slug') slug: string,
    @CurrentUser() user: { id: string },
    @Query('role') role?: string,
  ) {
    return this.seriesService.getOrCreateInviteLink(slug, user.id, role ?? 'EDITOR');
  }

  @Get('join/:token')
  @Public()
  previewInviteLink(@Param('token') token: string) {
    return this.seriesService.previewInviteLink(token);
  }

  @Post('join/:token')
  @UseGuards(JwtAuthGuard)
  joinViaToken(@Param('token') token: string, @CurrentUser() user: { id: string }) {
    return this.seriesService.joinViaToken(token, user.id);
  }

  @Post('join/:token/decline')
  @UseGuards(JwtAuthGuard)
  declineInviteLink(@Param('token') token: string, @CurrentUser() user: { id: string }) {
    return this.seriesService.declineInviteLink(token, user.id);
  }

  @Post('invites/:token/accept')
  @UseGuards(JwtAuthGuard)
  acceptInvite(@Param('token') token: string, @CurrentUser() user: { id: string }) {
    return this.seriesService.acceptInvite(token, user.id);
  }

  @Post('invites/:token/reject')
  @UseGuards(JwtAuthGuard)
  rejectInvite(@Param('token') token: string, @CurrentUser() user: { id: string }) {
    return this.seriesService.rejectInvite(token, user.id);
  }

  @Patch(':slug/members/:userId/role')
  @UseGuards(JwtAuthGuard)
  updateRole(
    @Param('slug') slug: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: { id: string },
    @Body('role') role: 'EDITOR' | 'CONTRIBUTOR' | 'VIEWER',
  ) {
    if (!role || !['EDITOR', 'CONTRIBUTOR', 'VIEWER'].includes(role)) {
      throw new BadRequestException('role must be EDITOR, CONTRIBUTOR, or VIEWER');
    }
    return this.seriesService.updateMemberRole(slug, user.id, targetUserId, role);
  }

  @Delete(':slug/members/:userId')
  @UseGuards(JwtAuthGuard)
  removeMember(
    @Param('slug') slug: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.seriesService.removeMember(slug, user.id, targetUserId);
  }

  // ─── Posts ───────────────────────────────────────────────────────────────────

  @Public()
  @Get(':slug/posts')
  @UseGuards(OptionalJwtAuthGuard)
  getPosts(
    @Param('slug') slug: string,
    @CurrentUser() user?: { id: string } | null,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.seriesService.getPosts(slug, user?.id ?? null, Number(limit) || 50, Number(offset) || 0);
  }

  @Get(':slug/posts/pending')
  @UseGuards(JwtAuthGuard)
  getPendingPosts(
    @Param('slug') slug: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.seriesService.getPendingPosts(slug, user.id);
  }

  @Post(':slug/posts/:postId')
  @UseGuards(JwtAuthGuard)
  addPost(
    @Param('slug') slug: string,
    @Param('postId') postId: string,
    @CurrentUser() user: { id: string },
    @Body('postVisibility') postVisibility?: string,
  ) {
    return this.seriesService.addPost(slug, user.id, postId, postVisibility ?? 'PUBLIC');
  }

  @Delete(':slug/posts/:postId')
  @UseGuards(JwtAuthGuard)
  removePost(
    @Param('slug') slug: string,
    @Param('postId') postId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.seriesService.removePost(slug, user.id, postId);
  }

  @Patch(':slug/posts/:postId/approve')
  @UseGuards(JwtAuthGuard)
  approvePost(
    @Param('slug') slug: string,
    @Param('postId') postId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.seriesService.approvePost(slug, user.id, postId);
  }

  @Delete(':slug/posts/:postId/reject')
  @UseGuards(JwtAuthGuard)
  rejectPost(
    @Param('slug') slug: string,
    @Param('postId') postId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.seriesService.rejectPost(slug, user.id, postId);
  }

  @Get(':slug/posts/pending-deletions')
  @UseGuards(JwtAuthGuard)
  getPendingDeletions(@Param('slug') slug: string, @CurrentUser() user: { id: string }) {
    return this.seriesService.getPendingDeletions(slug, user.id);
  }

  @Patch(':slug/posts/:postId/approve-deletion')
  @UseGuards(JwtAuthGuard)
  approveDeletion(
    @Param('slug') slug: string,
    @Param('postId') postId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.seriesService.approveDeletion(slug, user.id, postId);
  }

  @Patch(':slug/posts/:postId/reject-deletion')
  @UseGuards(JwtAuthGuard)
  rejectDeletion(
    @Param('slug') slug: string,
    @Param('postId') postId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.seriesService.rejectDeletion(slug, user.id, postId);
  }

  @Patch(':slug/posts/reorder')
  @UseGuards(JwtAuthGuard)
  reorderPosts(
    @Param('slug') slug: string,
    @CurrentUser() user: { id: string },
    @Body('postIds') postIds: string[],
  ) {
    if (!Array.isArray(postIds)) throw new BadRequestException('postIds must be an array');
    return this.seriesService.reorderPosts(slug, user.id, postIds);
  }

  // ─── Sections ────────────────────────────────────────────────────────────────

  @Public()
  @Get(':slug/sections')
  @UseGuards(OptionalJwtAuthGuard)
  getSections(@Param('slug') slug: string, @CurrentUser() user?: { id: string } | null) {
    return this.seriesService.getSections(slug, user?.id ?? null);
  }

  @Post(':slug/sections')
  @UseGuards(JwtAuthGuard)
  createSection(
    @Param('slug') slug: string,
    @CurrentUser() user: { id: string },
    @Body() dto: CreateSectionDto,
  ) {
    return this.seriesService.createSection(slug, user.id, dto);
  }

  @Patch(':slug/sections/reorder')
  @UseGuards(JwtAuthGuard)
  reorderSections(
    @Param('slug') slug: string,
    @CurrentUser() user: { id: string },
    @Body() dto: ReorderDto,
  ) {
    return this.seriesService.reorderSections(slug, user.id, dto);
  }

  @Patch(':slug/sections/:sectionId')
  @UseGuards(JwtAuthGuard)
  updateSection(
    @Param('slug') slug: string,
    @Param('sectionId') sectionId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateSectionDto,
  ) {
    return this.seriesService.updateSection(slug, sectionId, user.id, dto);
  }

  @Delete(':slug/sections/:sectionId')
  @UseGuards(JwtAuthGuard)
  deleteSection(
    @Param('slug') slug: string,
    @Param('sectionId') sectionId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.seriesService.deleteSection(slug, sectionId, user.id);
  }

  @Public()
  @Get(':slug/sections/:sectionId/posts')
  @UseGuards(OptionalJwtAuthGuard)
  getSectionPosts(
    @Param('slug') slug: string,
    @Param('sectionId') sectionId: string,
    @CurrentUser() user?: { id: string } | null,
  ) {
    return this.seriesService.getSectionPosts(slug, sectionId, user?.id ?? null);
  }

  @Post(':slug/sections/:sectionId/posts')
  @UseGuards(JwtAuthGuard)
  addPostToSection(
    @Param('slug') slug: string,
    @Param('sectionId') sectionId: string,
    @CurrentUser() user: { id: string },
    @Body('postId') postId: string,
  ) {
    if (!postId) throw new BadRequestException('postId is required');
    return this.seriesService.addPostToSection(slug, sectionId, user.id, postId);
  }

  @Delete(':slug/sections/:sectionId/posts/:postId')
  @UseGuards(JwtAuthGuard)
  removePostFromSection(
    @Param('slug') slug: string,
    @Param('sectionId') sectionId: string,
    @Param('postId') postId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.seriesService.removePostFromSection(slug, sectionId, user.id, postId);
  }

  @Patch(':slug/sections/:sectionId/posts/reorder')
  @UseGuards(JwtAuthGuard)
  reorderSectionPosts(
    @Param('slug') slug: string,
    @Param('sectionId') sectionId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: ReorderDto,
  ) {
    return this.seriesService.reorderSectionPosts(slug, sectionId, user.id, dto);
  }

  // ─── Follow ──────────────────────────────────────────────────────────────────

  @Post(':slug/follow')
  @UseGuards(JwtAuthGuard)
  follow(@Param('slug') slug: string, @CurrentUser() user: { id: string }) {
    return this.seriesService.follow(slug, user.id);
  }

  @Delete(':slug/follow')
  @UseGuards(JwtAuthGuard)
  unfollow(@Param('slug') slug: string, @CurrentUser() user: { id: string }) {
    return this.seriesService.unfollow(slug, user.id);
  }

  @Public()
  @Get(':slug/followers')
  getFollowers(
    @Param('slug') slug: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.seriesService.getFollowers(slug, Number(limit) || 20, Number(offset) || 0);
  }

  // ─── Analytics ───────────────────────────────────────────────────────────────

  @Get(':slug/analytics')
  @UseGuards(JwtAuthGuard)
  getAnalytics(@Param('slug') slug: string, @CurrentUser() user: { id: string }) {
    return this.seriesService.getAnalytics(slug, user.id);
  }
}
