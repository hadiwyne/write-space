import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common'
import { ThemesService } from './themes.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import { CreateThemeDto } from './dto/create-theme.dto'

@Controller('themes')
@UseGuards(JwtAuthGuard)
export class ThemesController {
  constructor(private readonly themesService: ThemesService) {}

  @Get()
  list(@CurrentUser() user: { id: string }) {
    return this.themesService.findByUserId(user.id)
  }

  @Post()
  create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateThemeDto,
  ) {
    return this.themesService.create(user.id, dto.name, dto.palette)
  }

  @Delete(':id')
  delete(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.themesService.delete(user.id, id)
  }
}
