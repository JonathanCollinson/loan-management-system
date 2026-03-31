import { ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { UserRole } from '../../common/enums/user-role.enum';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';

describe('UsersService', () => {
  let service: UsersService;
  const repo = {
    count: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    updateById: jest.fn(),
    findByRole: jest.fn(),
  };
  const config = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: repo },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();
    service = module.get(UsersService);
  });

  describe('toObject', () => {
    it('maps document fields', () => {
      const id = new Types.ObjectId();
      const doc = {
        _id: id,
        email: 'a@b.com',
        name: 'N',
        role: UserRole.USER,
        isActive: true,
        walletBalance: 100,
      };
      expect(service.toObject(doc as never)).toEqual({
        id: id.toString(),
        email: 'a@b.com',
        name: 'N',
        role: UserRole.USER,
        isActive: true,
        walletBalance: 100,
      });
    });
  });

  describe('createFieldUser', () => {
    it('throws when email exists', async () => {
      repo.findByEmail.mockResolvedValue({ _id: new Types.ObjectId() });
      await expect(
        service.createFieldUser(
          { email: 'x@y.com', password: 'password123', name: 'F' },
          new Types.ObjectId().toString(),
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('createAdmin', () => {
    it('throws when email exists', async () => {
      repo.findByEmail.mockResolvedValue({});
      await expect(
        service.createAdmin({
          email: 'x@y.com',
          password: 'password123',
          name: 'A',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('updateUser', () => {
    it('throws when user missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(
        service.updateUser(
          { userId: new Types.ObjectId().toString() },
          UserRole.SUPER_ADMIN,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
