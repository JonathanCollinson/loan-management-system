import { ForbiddenException } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '../../common/enums/user-role.enum';
import { LoansRepository } from '../loans/loans.repository';
import { UsersRepository } from '../users/users.repository';
import { RepaymentsService } from './repayments.service';
import { RepaymentsRepository } from './repayments.repository';

describe('RepaymentsService', () => {
  let service: RepaymentsService;
  const repaymentsRepo = { create: jest.fn(), findByOwnerLoanIds: jest.fn() };
  const loansRepo = { findById: jest.fn(), updateById: jest.fn() };
  const usersRepo = { incrementWallet: jest.fn() };

  const mockSession = {
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    abortTransaction: jest.fn(),
    endSession: jest.fn().mockResolvedValue(undefined),
  };
  const connection = {
    startSession: jest.fn().mockResolvedValue(mockSession),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RepaymentsService,
        { provide: RepaymentsRepository, useValue: repaymentsRepo },
        { provide: LoansRepository, useValue: loansRepo },
        { provide: UsersRepository, useValue: usersRepo },
        { provide: getConnectionToken(), useValue: connection },
      ],
    }).compile();
    service = module.get(RepaymentsService);
  });

  it('assertLoanAccess forbids USER for other owner loan', () => {
    expect(() =>
      service.assertLoanAccess('other-owner', {
        id: 'u1',
        email: 'u@test',
        role: UserRole.USER,
      }),
    ).toThrow(ForbiddenException);
  });
});
