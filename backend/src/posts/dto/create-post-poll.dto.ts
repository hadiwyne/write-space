import { IsBoolean, IsArray, IsString, IsOptional, MinLength, MaxLength, ArrayMinSize } from 'class-validator';

export class CreatePostPollDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Poll must have at least one option' })
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(500, { each: true })
  options: string[];

  @IsOptional()
  @IsBoolean()
  isOpen?: boolean;

  @IsOptional()
  @IsBoolean()
  resultsVisible?: boolean;
}
