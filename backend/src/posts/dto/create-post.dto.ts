import { IsString, IsOptional, IsBoolean, IsArray, IsEnum, MinLength, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ContentType, PostVisibility } from '@prisma/client';
import { CreatePostPollDto } from './create-post-poll.dto';

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

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreatePostPollDto)
  poll?: CreatePostPollDto;
}
