import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
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
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findByUsername(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        profileHTML: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { followers: true, following: true, reposts: true, likes: true } },
      },
    });
    if (!user) return null;
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

  async saveAvatar(userId: string, buffer: Buffer, mimeType: string) {
    const ext = mimeType === 'image/jpeg' ? '.jpg' : mimeType === 'image/png' ? '.png' : mimeType === 'image/gif' ? '.gif' : '.webp';
    const filename = `${userId}-${Date.now()}${ext}`;
    const uploadsDir = join(process.cwd(), 'uploads', 'avatars');
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(join(uploadsDir, filename), buffer);
    const baseUrl = (this.config.get<string>('API_PUBLIC_URL') || `http://localhost:${this.config.get('PORT', 3000)}`).replace(/\/$/, '');
    const avatarUrl = `${baseUrl}/uploads/avatars/${filename}`;
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: userSelectWithoutPassword,
    });
  }
}
