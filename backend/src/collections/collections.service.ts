import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';

const postInclude = {
  author: { select: { id: true, username: true, displayName: true, avatarUrl: true, avatarShape: true, avatarFrame: true, badgeUrl: true } },
  _count: { select: { likes: true, comments: true } },
};

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
}

@Injectable()
export class CollectionsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateCollectionDto) {
    const slug = dto.slug ? slugify(dto.slug) : slugify(dto.title) + '-' + Date.now().toString(36);
    const existing = await this.prisma.collection.findUnique({ where: { slug } });
    if (existing) throw new BadRequestException('Slug already in use');
    return this.prisma.collection.create({
      data: { userId, title: dto.title, description: dto.description ?? null, slug },
      include: { _count: { select: { items: true } } },
    });
  }

  async update(id: string, userId: string, dto: UpdateCollectionDto) {
    const col = await this.prisma.collection.findUnique({ where: { id } });
    if (!col) throw new NotFoundException('Collection not found');
    if (col.userId !== userId) throw new ForbiddenException('Not your collection');
    const slug = dto.slug != null ? slugify(dto.slug) : undefined;
    if (slug != null) {
      const taken = await this.prisma.collection.findFirst({ where: { slug, id: { not: id } } });
      if (taken) throw new BadRequestException('Slug already in use');
    }
    return this.prisma.collection.update({
      where: { id },
      data: {
        ...(dto.title != null && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(slug !== undefined && { slug }),
      },
      include: { _count: { select: { items: true } } },
    });
  }

  async remove(id: string, userId: string) {
    const col = await this.prisma.collection.findUnique({ where: { id } });
    if (!col) throw new NotFoundException('Collection not found');
    if (col.userId !== userId) throw new ForbiddenException('Not your collection');
    await this.prisma.collection.delete({ where: { id } });
    return { deleted: true };
  }

  async findByUser(userId: string, limit = 50, offset = 0) {
    return this.prisma.collection.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset,
      include: { _count: { select: { items: true } } },
    });
  }

  async findOne(idOrSlug: string, viewerUserId?: string | null) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idOrSlug);
    const col = await this.prisma.collection.findFirst({
      where: isUuid ? { id: idOrSlug } : { slug: idOrSlug },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatarUrl: true, avatarShape: true, avatarFrame: true, badgeUrl: true } },
        items: { orderBy: { order: 'asc' }, include: { post: { include: postInclude } } },
      },
    });
    if (!col) throw new NotFoundException('Collection not found');
    const isOwner = viewerUserId && col.userId === viewerUserId;
    const items = col.items.map((i) => ({ ...i.post, order: i.order, addedAt: i.addedAt }));
    return { ...col, items, isOwner };
  }

  async addPost(collectionId: string, postId: string, userId: string) {
    const col = await this.prisma.collection.findUnique({ where: { id: collectionId } });
    if (!col) throw new NotFoundException('Collection not found');
    if (col.userId !== userId) throw new ForbiddenException('Not your collection');
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    const maxOrder = await this.prisma.collectionPost.aggregate({
      where: { collectionId },
      _max: { order: true },
    });
    const order = (maxOrder._max.order ?? -1) + 1;
    await this.prisma.collectionPost.upsert({
      where: { collectionId_postId: { collectionId, postId } },
      create: { collectionId, postId, order },
      update: { order },
    });
    return { added: true };
  }

  async removePost(collectionId: string, postId: string, userId: string) {
    const col = await this.prisma.collection.findUnique({ where: { id: collectionId } });
    if (!col) throw new NotFoundException('Collection not found');
    if (col.userId !== userId) throw new ForbiddenException('Not your collection');
    await this.prisma.collectionPost.deleteMany({ where: { collectionId, postId } });
    return { removed: true };
  }
}
