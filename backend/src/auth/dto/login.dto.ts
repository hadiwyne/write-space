import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  /** Email or username. */
  @IsString()
  emailOrUsername: string;

  @IsString()
  @MinLength(6)
  password: string;
}
