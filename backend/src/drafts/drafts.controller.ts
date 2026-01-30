import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { DraftsService } from './drafts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { SaveDraftDto } from './dto/save-draft.dto';

@Controller('drafts')
@UseGuards(JwtAuthGuard)
export class DraftsController {
  constructor(private readonly draftsService: DraftsService) {}

  @Get()
  findAll(@CurrentUser() user: { id: string }, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    return this.draftsService.findAll(user.id, Number(limit) || 50, Number(offset) || 0);
  }

  @Get(':id/versions')
  getVersions(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.draftsService.getVersions(id, user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.draftsService.findOne(id, user.id);
  }

  @Post(':id/restore/:versionId')
  restore(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.draftsService.restore(id, versionId, user.id);
  }

  @Post()
  save(@CurrentUser() user: { id: string }, @Body() dto: SaveDraftDto) {
    return this.draftsService.save(user.id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.draftsService.remove(id, user.id);
  }
}
