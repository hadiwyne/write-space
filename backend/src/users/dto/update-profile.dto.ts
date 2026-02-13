import { IsString, IsOptional, MaxLength, IsObject } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  avatarShape?: string;

  @IsOptional()
  @IsObject()
  avatarFrame?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  profileHTML?: string;
}
