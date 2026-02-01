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
} from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';

@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateCollectionDto) {
    return this.collectionsService.create(user.id, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateCollectionDto,
  ) {
    return this.collectionsService.update(id, user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.collectionsService.remove(id, user.id);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  myList(
    @CurrentUser() user: { id: string },
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.collectionsService.findByUser(
      user.id,
      Number(limit) || 50,
      Number(offset) || 0,
    );
  }

  @Public()
  @Get(':idOrSlug')
  @UseGuards(OptionalJwtAuthGuard)
  findOne(
    @Param('idOrSlug') idOrSlug: string,
    @CurrentUser() user?: { id: string } | null,
  ) {
    return this.collectionsService.findOne(idOrSlug, user?.id ?? null);
  }

  @Post(':collectionId/posts/:postId')
  @UseGuards(JwtAuthGuard)
  addPost(
    @Param('collectionId') collectionId: string,
    @Param('postId') postId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.collectionsService.addPost(collectionId, postId, user.id);
  }

  @Delete(':collectionId/posts/:postId')
  @UseGuards(JwtAuthGuard)
  removePost(
    @Param('collectionId') collectionId: string,
    @Param('postId') postId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.collectionsService.removePost(collectionId, postId, user.id);
  }
}
