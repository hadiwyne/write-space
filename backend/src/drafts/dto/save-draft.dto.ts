import { IsString, IsOptional, IsEnum, IsObject, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ContentType } from '@prisma/client';

export class SaveDraftDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsString()
  content: string;

  @IsEnum(ContentType)
  contentType: ContentType;

  @IsOptional()
  @IsObject()
  editorState?: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  version?: number;
}
