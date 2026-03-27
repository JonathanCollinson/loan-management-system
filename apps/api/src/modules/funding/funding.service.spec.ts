import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { UserRole } from '../../common/enums/user-role.enum';
import type { JwtUser } from '../../common/types/jwt-user';
import { CapitalFundsService } from '../capital-funds/capital-funds.service';
import { MonthlyPrincipalBudgetService } from '../monthly-principal-budget/monthly-principal-budget.service';
import { LoansRepository } from '../loans/loans.repository';
import { UsersRepository } from '../users/users.repository';
import { FundingService } from './funding.service';
import { FundingRepository } from './funding.repository';
import { UserFundAllocationsRepository } from './user-fund-allocations.repository';

jest.mock('../../common/utils/mongo-transaction.util', () => ({
  withTransactionOrFallback: async (
    _c: unknown,
    fn: (s: unknown) => Promise<unknown>,
  ) => fn(null),
}));

describe('FundingService', () => {
  let service: FundingService;
  const fundingRepo = {
    create: jest.fn(),
    findForRecipient: jest.fn(),
    findAll: jest.fn(),
    sumAmountForRecipientInMonth: jest.fn(),
  };
  const usersRepo = {
    findById: jest.fn(),
    incrementWallet: jest.fn(),
    findByRole: jest.fn(),
  };
  const loansRepo = {
    findCreatedBetween: jest.fn(),
  };
  const budgetService = {
    assertFundingFitsBudget: jest.fn(),
  };
  const capitalFundsService = {
    allocateFieldFunding: jest.fn().mockResolvedValue(undefined),
  };
  const userFundAllocRepo = {
    incrementBalance: jest.fn().mockResolvedValue(undefined),
  };
  const connection = {};

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FundingService,
        { provide: FundingRepository, useValue: fundingRepo },
        { provide: UsersRepository, useValue: usersRepo },
        { provide: LoansRepository, useValue: loansRepo },
        {
          provide: MonthlyPrincipalBudgetService,
          useValue: budgetService,
        },
        { provide: CapitalFundsService, useValue: capitalFundsService },
        { provide: UserFundAllocationsRepository, useValue: userFundAllocRepo },
        { provide: getConnectionToken(), useValue: connection },
      ],
    }).compile();
    service = module.get(FundingService);
  });

  const admin: JwtUser = {
    id: new Types.ObjectId().toString(),
    email: 'a@test',
    role: UserRole.ADMIN,
  };

  const fundId = new Types.ObjectId();

  it('recordFunding rejects invalid recipient role', async () => {
    usersRepo.findById.mockResolvedValue({ role: 'invalid' });
    await expect(
      service.recordFunding(
        {
          recipientUserId: 'x',
          capitalFundId: fundId.toString(),
          amount: 100,
        } as never,
        admin,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('recordFunding allocates from fund, credits allocation and wallet', async () => {
    const recipientId = new Types.ObjectId();
    usersRepo.findById.mockResolvedValue({
      role: UserRole.USER,
    });
    fundingRepo.create.mockResolvedValue({
      _id: { toString: () => 'ft1' },
      adminUserId: { toString: () => admin.id },
      recipientUserId: { toString: () => recipientId.toString() },
      capitalFundId: fundId,
      amount: 50,
      period: '2026-03',
    });

    await service.recordFunding(
      {
        recipientUserId: recipientId.toString(),
        capitalFundId: fundId.toString(),
        amount: 50,
        period: '2026-03',
      } as never,
      admin,
    );

    expect(budgetService.assertFundingFitsBudget).toHaveBeenCalledWith(
      '2026-03',
      50,
    );
    expect(capitalFundsService.allocateFieldFunding).toHaveBeenCalledWith(
      fundId.toString(),
      50,
      recipientId.toString(),
      admin.id,
      undefined,
    );
    expect(userFundAllocRepo.incrementBalance).toHaveBeenCalledWith(
      recipientId.toString(),
      fundId.toString(),
      50,
      undefined,
    );
    expect(usersRepo.incrementWallet).toHaveBeenCalledWith(
      recipientId.toString(),
      50,
      undefined,
    );
    expect(fundingRepo.create).toHaveBeenCalled();
  });

  it('fundingUtilization forbids USER', async () => {
    await expect(
      service.fundingUtilization('2026-03', {
        id: 'u1',
        email: 'u@test',
        role: UserRole.USER,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
