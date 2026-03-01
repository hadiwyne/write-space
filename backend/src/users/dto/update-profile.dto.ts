import { IsString, IsOptional, MaxLength, MinLength, Matches, IsObject, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export const PRIVACY_VISIBILITY = ['NO_ONE', 'FOLLOWERS', 'PUBLIC'] as const;
export const WHO_CAN_FOLLOW_ME = ['PUBLIC', 'APPROVAL'] as const;

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'Username can only contain letters, numbers, and underscores' })
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/^@+/, '').trim() : value))
  username?: string;

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

  @IsOptional()
  @IsString()
  @IsIn(PRIVACY_VISIBILITY)
  whoCanSeeLikes?: string;

  @IsOptional()
  @IsString()
  @IsIn(PRIVACY_VISIBILITY)
  whoCanSeeFollowing?: string;

  @IsOptional()
  @IsString()
  @IsIn(PRIVACY_VISIBILITY)
  whoCanSeeFollowers?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsIn(WHO_CAN_FOLLOW_ME, { message: 'whoCanFollowMe must be PUBLIC or APPROVAL' })
  whoCanFollowMe?: string;
}
