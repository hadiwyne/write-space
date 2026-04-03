import { IsString, IsOptional, MaxLength, IsArray } from 'class-validator';

export class UpdateSectionDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  layoutMode?: string;
}

export class ReorderDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}
