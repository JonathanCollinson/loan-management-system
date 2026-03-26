import { BadRequestException } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { FundingRepository } from '../funding/funding.repository';
import { LoansRepository } from '../loans/loans.repository';
import { MonthlyPrincipalBudgetService } from './monthly-principal-budget.service';
import { MonthlyPrincipalBudgetRepository } from './monthly-principal-budget.repository';

describe('MonthlyPrincipalBudgetService', () => {
  let service: MonthlyPrincipalBudgetService;
  const repo = {
    findByMonth: jest.fn(),
    listEventsForMonth: jest.fn(),
    upsertTotal: jest.fn(),
    appendEvent: jest.fn(),
  };
  const fundingRepo = {
    sumTotalAllocationsInMonth: jest.fn(),
  };
  const loansRepo = {
    sumPrincipalCreatedBetween: jest.fn(),
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
    repo.findByMonth.mockResolvedValue(null);
    repo.listEventsForMonth.mockResolvedValue([]);
    fundingRepo.sumTotalAllocationsInMonth.mockResolvedValue(0);
    loansRepo.sumPrincipalCreatedBetween.mockResolvedValue(0);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MonthlyPrincipalBudgetService,
        { provide: MonthlyPrincipalBudgetRepository, useValue: repo },
        { provide: FundingRepository, useValue: fundingRepo },
        { provide: LoansRepository, useValue: loansRepo },
        { provide: getConnectionToken(), useValue: connection },
      ],
    }).compile();
    service = module.get(MonthlyPrincipalBudgetService);
  });

  describe('assertFundingFitsBudget', () => {
    it('no-ops when no budget for month', async () => {
      repo.findByMonth.mockResolvedValue(null);
      await expect(
        service.assertFundingFitsBudget('2026-03', 999999),
      ).resolves.toBeUndefined();
    });

    it('throws when allocation would exceed cap', async () => {
      repo.findByMonth.mockResolvedValue({ totalPrincipal: 100 });
      fundingRepo.sumTotalAllocationsInMonth.mockResolvedValue(80);
      await expect(
        service.assertFundingFitsBudget('2026-03', 30),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('assertLoanFitsBudget', () => {
    it('throws when loan principal would exceed cap', async () => {
      repo.findByMonth.mockResolvedValue({ totalPrincipal: 100 });
      loansRepo.sumPrincipalCreatedBetween.mockResolvedValue(90);
      await expect(
        service.assertLoanFitsBudget('2026-03', 20),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
