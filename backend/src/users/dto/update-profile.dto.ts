import { IsString, IsOptional, MaxLength, IsObject, IsIn } from 'class-validator';

export const PRIVACY_VISIBILITY = ['NO_ONE', 'FOLLOWERS', 'PUBLIC'] as const;
export const WHO_CAN_FOLLOW_ME = ['PUBLIC', 'APPROVAL'] as const;

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
  @IsIn(WHO_CAN_FOLLOW_ME)
  whoCanFollowMe?: string;
}
