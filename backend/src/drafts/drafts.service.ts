import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SaveDraftDto } from './dto/save-draft.dto';

@Injectable()
export class DraftsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, limit = 50, offset = 0) {
    return this.prisma.draft.findMany({
      where: { userId, previousVersionId: null },
      orderBy: { lastSavedAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async findOne(id: string, userId: string) {
    const draft = await this.prisma.draft.findUnique({ where: { id } });
    if (!draft) throw new NotFoundException('Draft not found');
    if (draft.userId !== userId) throw new ForbiddenException('Not your draft');
    return draft;
  }

  async getVersions(id: string, userId: string) {
    const draft = await this.findOne(id, userId);
    const versions = await this.prisma.draft.findMany({
      where: { previousVersionId: id },
      orderBy: { version: 'desc' },
      select: { id: true, version: true, lastSavedAt: true, createdAt: true },
    });
    return { current: draft, versions };
  }

  async restore(id: string, versionId: string, userId: string) {
    await this.findOne(id, userId);
    const versionDraft = await this.prisma.draft.findUnique({ where: { id: versionId } });
    if (!versionDraft || versionDraft.previousVersionId !== id || versionDraft.userId !== userId) {
      throw new NotFoundException('Version not found');
    }
    return this.prisma.draft.update({
      where: { id },
      data: {
        content: versionDraft.content,
        contentType: versionDraft.contentType,
        title: versionDraft.title,
        editorState: versionDraft.editorState as Prisma.InputJsonValue,
        lastSavedAt: new Date(),
      },
    });
  }

  async save(userId: string, dto: SaveDraftDto) {
    const data: Prisma.DraftUncheckedCreateInput = {
      userId,
      title: dto.title ?? null,
      content: dto.content,
      contentType: dto.contentType,
      editorState: (dto.editorState ?? undefined) as Prisma.InputJsonValue | undefined,
    };
    if (dto.id) {
      const existing = await this.prisma.draft.findUnique({ where: { id: dto.id } });
      if (!existing) throw new NotFoundException('Draft not found');
      if (existing.userId !== userId) throw new ForbiddenException('Not your draft');
      if (dto.version !== undefined && dto.version < existing.version) {
        throw new ConflictException({ message: 'Draft was updated elsewhere', serverDraft: existing });
      }
      await this.prisma.draft.create({
        data: {
          userId,
          title: existing.title,
          content: existing.content,
          contentType: existing.contentType,
          editorState: existing.editorState as Prisma.InputJsonValue,
          version: existing.version,
          previousVersionId: existing.id,
        },
      });
      return this.prisma.draft.update({
        where: { id: dto.id },
        data: {
          ...data,
          version: existing.version + 1,
          lastSavedAt: new Date(),
        },
      });
    }
    return this.prisma.draft.create({
      data: { ...data, lastSavedAt: new Date(), previousVersionId: null },
    });
  }

  async remove(id: string, userId: string) {
    const draft = await this.prisma.draft.findUnique({ where: { id } });
    if (!draft) throw new NotFoundException('Draft not found');
    if (draft.userId !== userId) throw new ForbiddenException('Not your draft');
    await this.prisma.draft.delete({ where: { id } });
    return { deleted: true };
  }
}
