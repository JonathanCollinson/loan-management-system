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
import { CapitalFundsRepository } from '../capital-funds/capital-funds.repository';
import { CapitalFundsService } from '../capital-funds/capital-funds.service';
import { MonthlyPrincipalBudgetService } from '../monthly-principal-budget/monthly-principal-budget.service';
import { BorrowersRepository } from '../borrowers/borrowers.repository';
import { UserFundAllocationsRepository } from '../funding/user-fund-allocations.repository';
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
    updateMany: jest.fn(),
  };
  const borrowersRepo = {
    findById: jest.fn(),
  };
  const capitalFundsRepo = {
    findById: jest.fn(),
  };
  const capitalFundsService = {
    ensureLegacyFundExists: jest
      .fn()
      .mockResolvedValue(new Types.ObjectId().toString()),
    assertPrincipalWithinPolicy: jest.fn(),
    assertCanUsePrincipalFundForFilter: jest.fn().mockResolvedValue(undefined),
    resolveDefaultInterestRatePercent: jest.fn(
      (_f: unknown, sys: number) => sys,
    ),
    resolveDefaultTermMonths: jest.fn().mockReturnValue(undefined),
    effectiveRolloverMode: jest.fn((_f: unknown, g: string) => g),
    canOverrideInterest: jest.fn(),
    disburseForLoan: jest.fn().mockResolvedValue(undefined),
  };
  const systemConfig = {
    getDefaultInterestRate: jest.fn().mockResolvedValue(10),
    getDefaultTermMonths: jest.fn().mockResolvedValue(1),
    getGlobalRolloverMode: jest.fn().mockResolvedValue('MANUAL'),
  };
  const budgetService = {
    assertLoanFitsBudget: jest.fn().mockResolvedValue(undefined),
  };
  const userFundAllocRepo = {
    decrementBalanceIfGte: jest.fn().mockResolvedValue(true),
    incrementBalance: jest.fn().mockResolvedValue(undefined),
  };
  const usersRepo = {
    decrementWalletIfGte: jest.fn().mockResolvedValue({ _id: 'u' }),
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

  const fundId = new Types.ObjectId();
  const mockFund = {
    _id: fundId,
    name: 'Test fund',
    balance: 1_000_000,
    isActive: true,
    policy: {},
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    capitalFundsRepo.findById.mockResolvedValue(mockFund);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoansService,
        { provide: LoansRepository, useValue: loansRepo },
        { provide: BorrowersRepository, useValue: borrowersRepo },
        { provide: CapitalFundsRepository, useValue: capitalFundsRepo },
        { provide: CapitalFundsService, useValue: capitalFundsService },
        { provide: SystemConfigService, useValue: systemConfig },
        {
          provide: MonthlyPrincipalBudgetService,
          useValue: budgetService,
        },
        { provide: getConnectionToken(), useValue: connection },
        { provide: UserFundAllocationsRepository, useValue: userFundAllocRepo },
        { provide: UsersRepository, useValue: usersRepo },
      ],
    }).compile();
    service = module.get(LoansService);
  });

  const ownerId = new Types.ObjectId();
  const borrowerId = new Types.ObjectId();

  const baseInput = {
    borrowerId: borrowerId.toString(),
    principalFundId: fundId.toString(),
    principalAmount: 100,
    interestType: InterestType.FLAT,
    termMonths: 3,
  };

  it('createLoan throws when borrower missing', async () => {
    borrowersRepo.findById.mockResolvedValue(null);
    await expect(
      service.createLoan(baseInput, {
        id: 'u1',
        email: 'u@test',
        role: UserRole.USER,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('createLoan forbids USER when borrower owned by another', async () => {
    borrowersRepo.findById.mockResolvedValue({
      createdByUserId: ownerId,
    });
    await expect(
      service.createLoan(baseInput, {
        id: new Types.ObjectId().toString(),
        email: 'u@test',
        role: UserRole.USER,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('createLoan fails when fund has insufficient balance', async () => {
    borrowersRepo.findById.mockResolvedValue({
      createdByUserId: ownerId,
    });
    capitalFundsService.disburseForLoan.mockRejectedValueOnce(
      new BadRequestException(
        'Insufficient balance in the selected capital fund',
      ),
    );
    const loanId = new Types.ObjectId();
    loansRepo.create.mockResolvedValue({
      _id: loanId,
      borrowerId,
      ownerUserId: ownerId,
      principalFundId: fundId,
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
      rolloverCount: 0,
    });

    await expect(
      service.createLoan(baseInput, {
        id: ownerId.toString(),
        email: 'u@test',
        role: UserRole.USER,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(capitalFundsService.disburseForLoan).toHaveBeenCalled();
  });

  it('createLoan disburses from fund for ADMIN actor', async () => {
    const adminId = new Types.ObjectId();
    borrowersRepo.findById.mockResolvedValue({
      createdByUserId: ownerId,
    });
    const loanOid = new Types.ObjectId();
    loansRepo.create.mockResolvedValue({
      _id: loanOid,
      borrowerId,
      ownerUserId: ownerId,
      principalFundId: fundId,
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
      rolloverCount: 0,
    });

    await service.createLoan(baseInput, {
      id: adminId.toString(),
      email: 'a@test',
      role: UserRole.ADMIN,
    } as JwtUser);

    expect(capitalFundsService.disburseForLoan).toHaveBeenCalledWith(
      fundId.toString(),
      100,
      loanOid.toString(),
      adminId.toString(),
      mockSession,
    );
  });

  it('createLoan ignores input interestRate for USER (uses system default)', async () => {
    borrowersRepo.findById.mockResolvedValue({
      createdByUserId: ownerId,
    });
    loansRepo.create.mockResolvedValue({
      _id: new Types.ObjectId(),
      borrowerId,
      ownerUserId: ownerId,
      principalFundId: fundId,
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
      rolloverCount: 0,
    });

    await service.createLoan(
      {
        ...baseInput,
        interestRate: 99,
      },
      {
        id: ownerId.toString(),
        email: 'u@test',
        role: UserRole.USER,
      },
    );

    expect(systemConfig.getDefaultInterestRate).toHaveBeenCalled();
    expect(loansRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ interestRate: 10 }),
      mockSession,
    );
  });

  it('updateLoan forbids USER', async () => {
    await expect(
      service.updateLoan(
        { loanId: new Types.ObjectId().toString(), termMonths: 6 },
        { id: 'u1', email: 'u@test', role: UserRole.USER },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rolloverLoan forbids USER when fund is MANUAL', async () => {
    const loanId = new Types.ObjectId();
    loansRepo.findById.mockResolvedValue({
      _id: loanId,
      status: LoanStatus.ACTIVE,
      outstandingAmount: 50,
      totalPaid: 0,
      ownerUserId: ownerId,
      principalFundId: fundId,
      interestAmount: 10,
      totalAmount: 110,
      termMonths: 3,
      endDate: new Date(),
      rolloverCount: 0,
    });
    capitalFundsRepo.findById.mockResolvedValue({
      ...mockFund,
      policy: { rolloverMode: 'MANUAL' },
    });
    await expect(
      service.rolloverLoan(
        { loanId: loanId.toString() },
        { id: ownerId.toString(), email: 'u@test', role: UserRole.USER },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('listLoans calls assertCanUsePrincipalFundForFilter when fund filter set', async () => {
    loansRepo.findAll.mockResolvedValue([]);
    await service.listLoans(
      { id: 'a1', email: 'a@test', role: UserRole.ADMIN },
      fundId.toString(),
    );
    expect(
      capitalFundsService.assertCanUsePrincipalFundForFilter,
    ).toHaveBeenCalledWith(expect.any(Object), fundId.toString());
  });

  it('listLoans returns only loans for the selected principal fund', async () => {
    const f1 = new Types.ObjectId();
    const f2 = new Types.ObjectId();
    const paidLoan = (fid: Types.ObjectId) => ({
      _id: new Types.ObjectId(),
      borrowerId,
      ownerUserId: ownerId,
      principalFundId: fid,
      principalAmount: 100,
      interestRate: 10,
      interestType: InterestType.FLAT,
      interestAmount: 10,
      totalAmount: 110,
      termMonths: 3,
      startDate: new Date(),
      endDate: new Date(),
      monthlyInstallment: 36.67,
      status: LoanStatus.PAID,
      totalPaid: 110,
      outstandingAmount: 0,
      paidAt: new Date(),
      rolloverCount: 0,
    });
    loansRepo.findAll.mockResolvedValue([paidLoan(f1), paidLoan(f2)]);
    const out = await service.listLoans(
      { id: 'a1', email: 'a@test', role: UserRole.ADMIN },
      f1.toString(),
    );
    expect(out).toHaveLength(1);
    expect(out[0].principalFundId).toBe(f1.toString());
  });

  it('listLoans filters by loan createdAt month', async () => {
    const f = fundId;
    const inMarch = new Date(2025, 2, 15);
    const inApril = new Date(2025, 3, 10);
    const loanBase = (createdAt: Date) => ({
      _id: new Types.ObjectId(),
      borrowerId,
      ownerUserId: ownerId,
      principalFundId: f,
      principalAmount: 100,
      interestRate: 10,
      interestType: InterestType.FLAT,
      interestAmount: 10,
      totalAmount: 110,
      termMonths: 3,
      startDate: new Date(),
      endDate: new Date(),
      monthlyInstallment: 36.67,
      status: LoanStatus.PAID,
      totalPaid: 110,
      outstandingAmount: 0,
      paidAt: new Date(),
      rolloverCount: 0,
      createdAt: createdAt,
    });
    loansRepo.findAll.mockResolvedValue([loanBase(inMarch), loanBase(inApril)]);
    const out = await service.listLoans(
      { id: 'a1', email: 'a@test', role: UserRole.ADMIN },
      null,
      '2025-03',
    );
    expect(out).toHaveLength(1);
  });
});
