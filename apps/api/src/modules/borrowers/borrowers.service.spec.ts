import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { UserRole } from '../../common/enums/user-role.enum';
import type { JwtUser } from '../../common/types/jwt-user';
import { Loan } from '../loans/schemas/loan.schema';
import { UsersRepository } from '../users/users.repository';
import { BorrowersService } from './borrowers.service';
import { BorrowersRepository } from './borrowers.repository';

describe('BorrowersService', () => {
  let service: BorrowersService;
  const borrowersRepo = {
    findByOwner: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    updateById: jest.fn(),
  };
  const usersRepo = {
    findById: jest.fn(),
  };
  const loanModel = {
    find: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BorrowersService,
        { provide: BorrowersRepository, useValue: borrowersRepo },
        { provide: UsersRepository, useValue: usersRepo },
        { provide: getModelToken(Loan.name), useValue: loanModel },
      ],
    }).compile();
    service = module.get(BorrowersService);
  });

  const fieldUser = (id: string): JwtUser => ({
    id,
    email: 'u@test',
    role: UserRole.USER,
  });

  it('createBorrower rejects ownerUserId for USER actor', async () => {
    await expect(
      service.createBorrower(
        {
          name: 'B',
          ownerUserId: new Types.ObjectId().toString(),
        } as never,
        fieldUser('u1'),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('createBorrower requires ownerUserId for ADMIN', async () => {
    const admin: JwtUser = {
      id: 'a1',
      email: 'a@test',
      role: UserRole.ADMIN,
    };
    await expect(
      service.createBorrower({ name: 'B' } as never, admin),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('listBorrowers uses findByOwner for USER', async () => {
    borrowersRepo.findByOwner.mockResolvedValue([]);
    await service.listBorrowers(fieldUser('u1'));
    expect(borrowersRepo.findByOwner).toHaveBeenCalledWith('u1');
    expect(borrowersRepo.findAll).not.toHaveBeenCalled();
  });

  it('listBorrowers uses findAll for ADMIN', async () => {
    borrowersRepo.findAll.mockResolvedValue([]);
    await service.listBorrowers({
      id: 'a1',
      email: 'a@test',
      role: UserRole.ADMIN,
    });
    expect(borrowersRepo.findAll).toHaveBeenCalled();
  });

  it('assertCanAccessBorrower forbids USER accessing other owner', () => {
    const doc = {
      createdByUserId: new Types.ObjectId(),
    };
    expect(() =>
      service.assertCanAccessBorrower(doc as never, fieldUser('other')),
    ).toThrow(ForbiddenException);
  });
});
