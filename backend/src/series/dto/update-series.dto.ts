import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  IsHexColor,
  IsNumber,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export class UpdateSeriesDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  tagline?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['PUBLIC', 'FOLLOWERS_ONLY', 'PRIVATE'])
  visibility?: 'PUBLIC' | 'FOLLOWERS_ONLY' | 'PRIVATE';

  @IsOptional()
  @IsHexColor()
  coverBgColor?: string | null;

  @IsOptional()
  @IsHexColor()
  accentColor?: string | null;

  @IsOptional()
  @IsHexColor()
  bgColor?: string | null;

  @IsOptional()
  @IsString()
  fontFamily?: string | null;

  @IsOptional()
  @IsString()
  layoutMode?: string;

  @IsOptional()
  @IsString()
  postListMode?: string;

  @IsOptional()
  @IsBoolean()
  showTopPosts?: boolean;

  @IsOptional()
  @IsBoolean()
  showTagline?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  coverFocalY?: number | null;

  @IsOptional()
  @IsArray()
  navLinks?: any[] | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pinnedPostIds?: string[];
}
