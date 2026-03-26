import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { InterestType } from '../../common/enums/interest-type.enum';
import { LoanStatus } from '../../common/enums/loan-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import type { JwtUser } from '../../common/types/jwt-user';
import { MonthlyPrincipalBudgetService } from '../monthly-principal-budget/monthly-principal-budget.service';
import { BorrowersRepository } from '../borrowers/borrowers.repository';
import { SystemConfigService } from '../system-config/system-config.service';
import { UsersRepository } from '../users/users.repository';
import { LoansService } from './loans.service';
import { LoansRepository } from './loans.repository';

describe('LoansService', () => {
  let service: LoansService;
  const loansRepo = {
    create: jest.fn(),
    findByOwner: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    updateById: jest.fn(),
  };
  const borrowersRepo = {
    findById: jest.fn(),
  };
  const usersRepo = {
    decrementWalletIfGte: jest.fn(),
  };
  const systemConfig = {
    getDefaultInterestRate: jest.fn().mockResolvedValue(10),
  };
  const budgetService = {
    assertLoanFitsBudget: jest.fn().mockResolvedValue(undefined),
  };

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
        LoansService,
        { provide: LoansRepository, useValue: loansRepo },
        { provide: BorrowersRepository, useValue: borrowersRepo },
        { provide: UsersRepository, useValue: usersRepo },
        { provide: SystemConfigService, useValue: systemConfig },
        {
          provide: MonthlyPrincipalBudgetService,
          useValue: budgetService,
        },
        { provide: getConnectionToken(), useValue: connection },
      ],
    }).compile();
    service = module.get(LoansService);
  });

  const ownerId = new Types.ObjectId();
  const borrowerId = new Types.ObjectId();

  it('createLoan throws when borrower missing', async () => {
    borrowersRepo.findById.mockResolvedValue(null);
    await expect(
      service.createLoan(
        {
          borrowerId: borrowerId.toString(),
          principalAmount: 100,
          interestType: InterestType.FLAT,
          termMonths: 3,
        },
        { id: 'u1', email: 'u@test', role: UserRole.USER },
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('createLoan forbids USER when borrower owned by another', async () => {
    borrowersRepo.findById.mockResolvedValue({
      createdByUserId: ownerId,
    });
    await expect(
      service.createLoan(
        {
          borrowerId: borrowerId.toString(),
          principalAmount: 100,
          interestType: InterestType.FLAT,
          termMonths: 3,
        },
        {
          id: new Types.ObjectId().toString(),
          email: 'u@test',
          role: UserRole.USER,
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('createLoan fails when wallet insufficient', async () => {
    borrowersRepo.findById.mockResolvedValue({
      createdByUserId: ownerId,
    });
    usersRepo.decrementWalletIfGte.mockResolvedValue(false);

    await expect(
      service.createLoan(
        {
          borrowerId: borrowerId.toString(),
          principalAmount: 100,
          interestType: InterestType.FLAT,
          termMonths: 3,
        },
        {
          id: ownerId.toString(),
          email: 'u@test',
          role: UserRole.USER,
        },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(usersRepo.decrementWalletIfGte).toHaveBeenCalledWith(
      ownerId.toString(),
      100,
      mockSession,
    );
  });

  it('createLoan debits admin wallet for ADMIN actor', async () => {
    const adminId = new Types.ObjectId();
    borrowersRepo.findById.mockResolvedValue({
      createdByUserId: ownerId,
    });
    usersRepo.decrementWalletIfGte.mockResolvedValue(true);
    loansRepo.create.mockResolvedValue({
      _id: new Types.ObjectId(),
      borrowerId,
      ownerUserId: ownerId,
      principalAmount: 100,
      interestRate: 10,
      interestType: InterestType.FLAT,
      interestAmount: 10,
      totalAmount: 110,
      termMonths: 3,
      startDate: new Date(),
      endDate: new Date(),
      monthlyInstallment: 110 / 3,
      status: LoanStatus.ACTIVE,
      totalPaid: 0,
      outstandingAmount: 110,
    });

    await service.createLoan(
      {
        borrowerId: borrowerId.toString(),
        principalAmount: 100,
        interestType: InterestType.FLAT,
        termMonths: 3,
      },
      {
        id: adminId.toString(),
        email: 'a@test',
        role: UserRole.ADMIN,
      } as JwtUser,
    );

    expect(usersRepo.decrementWalletIfGte).toHaveBeenCalledWith(
      adminId.toString(),
      100,
      mockSession,
    );
  });
});
