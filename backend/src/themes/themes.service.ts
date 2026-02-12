import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { validatePalette } from './dto/create-theme.dto'

@Injectable()
export class ThemesService {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string) {
    const rows = await this.prisma.userTheme.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, palette: true },
    })
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      palette: r.palette as Record<string, string>,
    }))
  }

  async create(userId: string, name: string, palette: Record<string, string>) {
    if (!validatePalette(palette)) {
      throw new BadRequestException('Invalid palette')
    }
    const created = await this.prisma.userTheme.create({
      data: {
        userId,
        name: name.trim(),
        palette: palette as object,
      },
      select: { id: true, name: true, palette: true },
    })
    return {
      id: created.id,
      name: created.name,
      palette: created.palette as Record<string, string>,
    }
  }

  async delete(userId: string, themeId: string) {
    const theme = await this.prisma.userTheme.findFirst({
      where: { id: themeId, userId },
    })
    if (!theme) throw new NotFoundException('Theme not found')
    await this.prisma.userTheme.delete({
      where: { id: themeId },
    })
    return { deleted: true }
  }
}
