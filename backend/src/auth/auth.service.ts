import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(emailOrUsername: string, password: string) {
    const trimmed = (emailOrUsername || '').trim();
    const isEmail = trimmed.includes('@') && !trimmed.startsWith('@') && trimmed.includes('.', trimmed.indexOf('@'));
    const user = isEmail
      ? await this.usersService.findByEmail(trimmed)
      : await this.usersService.findByUsernameForAuth(trimmed);
    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      const { passwordHash: _passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.emailOrUsername, dto.password);
    if (!user) throw new UnauthorizedException('Invalid email, username or password');
    return { accessToken: this.jwtService.sign({ sub: user.id, email: user.email }) };
  }

  async register(dto: RegisterDto) {
    const user = await this.usersService.create(dto);
    return { accessToken: this.jwtService.sign({ sub: user.id, email: user.email }) };
  }
}
