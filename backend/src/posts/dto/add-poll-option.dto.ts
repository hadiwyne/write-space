import { IsString, MinLength, MaxLength } from 'class-validator';

export class AddPollOptionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  text: string;
}
