import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '../../common/enums/user-role.enum';
import { LoginInput } from './dto/login.input';
import { AuthPayload } from './graphql/auth-payload.object';
import { UsersService } from '../users/users.service';

export type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(input: LoginInput): Promise<AuthPayload> {
    const user = await this.usersService.validateCredentials(
      input.email,
      input.password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    return {
      accessToken: this.jwtService.sign(payload),
      user: this.usersService.toObject(user),
    };
  }
}
