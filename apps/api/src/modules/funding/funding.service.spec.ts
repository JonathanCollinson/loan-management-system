import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { UserRole } from '../../common/enums/user-role.enum';
import type { JwtUser } from '../../common/types/jwt-user';
import { MonthlyPrincipalBudgetService } from '../monthly-principal-budget/monthly-principal-budget.service';
import { LoansRepository } from '../loans/loans.repository';
import { UsersRepository } from '../users/users.repository';
import { FundingService } from './funding.service';
import { FundingRepository } from './funding.repository';

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
      ],
    }).compile();
    service = module.get(FundingService);
  });

  const admin: JwtUser = {
    id: new Types.ObjectId().toString(),
    email: 'a@test',
    role: UserRole.ADMIN,
  };

  it('recordFunding rejects invalid recipient role', async () => {
    usersRepo.findById.mockResolvedValue({ role: 'invalid' });
    await expect(
      service.recordFunding(
        {
          recipientUserId: 'x',
          amount: 100,
        } as never,
        admin,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('recordFunding calls assertFundingFitsBudget when period set', async () => {
    const recipientId = new Types.ObjectId();
    usersRepo.findById.mockResolvedValue({
      role: UserRole.USER,
    });
    fundingRepo.create.mockResolvedValue({
      _id: { toString: () => 'ft1' },
      adminUserId: { toString: () => admin.id },
      recipientUserId: { toString: () => recipientId.toString() },
      amount: 50,
      period: '2026-03',
    });

    await service.recordFunding(
      {
        recipientUserId: recipientId.toString(),
        amount: 50,
        period: '2026-03',
      } as never,
      admin,
    );

    expect(budgetService.assertFundingFitsBudget).toHaveBeenCalledWith(
      '2026-03',
      50,
    );
    expect(usersRepo.incrementWallet).toHaveBeenCalledWith(
      recipientId.toString(),
      50,
    );
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
