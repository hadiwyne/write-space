import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateSectionDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  layoutMode?: string;
}
