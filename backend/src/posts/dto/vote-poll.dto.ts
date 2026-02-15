import { IsString, IsUUID } from 'class-validator';

export class VotePollDto {
  @IsString()
  @IsUUID()
  optionId: string;
}
