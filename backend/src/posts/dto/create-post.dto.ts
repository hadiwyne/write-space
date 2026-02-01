import { IsString, IsOptional, IsBoolean, IsArray, IsEnum, MinLength, MaxLength } from 'class-validator';
import { ContentType, PostVisibility } from '@prisma/client';

export class CreatePostDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title: string;

  @IsString()
  content: string;

  @IsEnum(ContentType)
  contentType: ContentType;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsEnum(PostVisibility)
  visibility?: PostVisibility;
}
