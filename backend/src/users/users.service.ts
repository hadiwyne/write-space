import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const DOMPurify = require('isomorphic-dompurify') as { sanitize: (html: string, options?: object) => string };
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from '../auth/dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

const userSelectWithoutPassword = {
  id: true,
  email: true,
  username: true,
  displayName: true,
  bio: true,
  profileHTML: true,
  avatarUrl: true,
  isSuperadmin: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  /** For auth: returns only id, email, passwordHash so we can verify then fetch user without hash. */
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, passwordHash: true },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: userSelectWithoutPassword,
    });
  }

  async findMe(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        bio: true,
        profileHTML: true,
        avatarUrl: true,
        isSuperadmin: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /** Returns profile by username. If profile is superadmin and viewer is not that user, returns null (invisible). */
  async findByUsername(username: string, viewerId?: string | null) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        profileHTML: true,
        avatarUrl: true,
        isSuperadmin: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { followers: true, following: true, reposts: true, likes: true } },
      },
    });
    if (!user) return null;
    if ((user as { isSuperadmin?: boolean }).isSuperadmin && viewerId !== user.id) return null;
    const postsCount = await this.prisma.post.count({
      where: {
        authorId: user.id,
        isPublished: true,
        archivedAt: null,
      },
    });
    return {
      ...user,
      _count: {
        ...user._count,
        posts: postsCount,
      },
    };
  }

  async create(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
    });
    if (existing) {
      if (existing.email === dto.email) throw new ConflictException('Email already registered');
      throw new ConflictException('Username already taken');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: { email: dto.email, username: dto.username, passwordHash },
      select: userSelectWithoutPassword,
    });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    const profileHTML =
      dto.profileHTML !== undefined
        ? DOMPurify.sanitize(dto.profileHTML, {
            ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'span', 'div'],
            ALLOWED_ATTR: ['href', 'src', 'alt', 'class'],
          })
        : undefined;
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        displayName: dto.displayName,
        bio: dto.bio,
        avatarUrl: dto.avatarUrl,
        ...(profileHTML !== undefined && { profileHTML }),
      },
      select: userSelectWithoutPassword,
    });
  }

  /** Save avatar to database (persists on ephemeral hosts like Koyeb; no R2/credit card needed). */
  async saveAvatar(userId: string, buffer: Buffer, mimeType: string) {
    const avatarUrl = `/users/avatar/${userId}`;
    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl, avatarData: buffer, avatarMimeType: mimeType },
    });
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: userSelectWithoutPassword,
    });
  }

  /** Get avatar image buffer and mime type for a user (for DB-stored avatars). */
  async getAvatar(userId: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarData: true, avatarMimeType: true },
    });
    if (!user?.avatarData || !user.avatarMimeType) return null;
    return { buffer: Buffer.from(user.avatarData), mimeType: user.avatarMimeType };
  }
}
