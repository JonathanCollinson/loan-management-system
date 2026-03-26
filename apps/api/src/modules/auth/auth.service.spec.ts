import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { UserRole } from '../../common/enums/user-role.enum';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let service: AuthService;
  const usersService = {
    validateCredentials: jest.fn(),
    toObject: jest.fn(),
  };
  const jwtService = {
    sign: jest.fn().mockReturnValue('jwt-token'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  it('login throws when credentials invalid', async () => {
    usersService.validateCredentials.mockResolvedValue(null);
    await expect(
      service.login({ email: 'a@b.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('login returns token and user payload', async () => {
    const id = new Types.ObjectId();
    const userDoc = {
      _id: id,
      email: 'a@b.com',
      role: UserRole.USER,
    };
    usersService.validateCredentials.mockResolvedValue(userDoc);
    usersService.toObject.mockReturnValue({
      id: id.toString(),
      email: 'a@b.com',
      role: UserRole.USER,
    });

    const out = await service.login({ email: 'a@b.com', password: 'ok' });

    expect(out.accessToken).toBe('jwt-token');
    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: id.toString(),
      email: 'a@b.com',
      role: UserRole.USER,
    });
    expect(out.user.id).toBe(id.toString());
  });
});
