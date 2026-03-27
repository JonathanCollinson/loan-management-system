import { Test, TestingModule } from '@nestjs/testing';
import { LoanStatus } from '../../common/enums/loan-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import { Types } from 'mongoose';
import { CapitalFundsRepository } from '../capital-funds/capital-funds.repository';
import { UserFundAllocationsRepository } from '../funding/user-fund-allocations.repository';
import { LoansRepository } from '../loans/loans.repository';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  const loansRepo = {
    findByOwner: jest.fn(),
    findAll: jest.fn(),
  };
  const capitalFundsRepo = {
    findAll: jest.fn().mockResolvedValue([]),
    findById: jest.fn(),
  };
  const userFundAllocRepo = {
    sumBalanceByFund: jest.fn().mockResolvedValue(0),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: LoansRepository, useValue: loansRepo },
        { provide: CapitalFundsRepository, useValue: capitalFundsRepo },
        { provide: UserFundAllocationsRepository, useValue: userFundAllocRepo },
      ],
    }).compile();
    service = module.get(DashboardService);
  });

  it('getDashboard uses findByOwner for USER', async () => {
    loansRepo.findByOwner.mockResolvedValue([]);
    await service.getDashboard({
      id: 'u1',
      email: 'u@test',
      role: UserRole.USER,
    });
    expect(loansRepo.findByOwner).toHaveBeenCalledWith('u1');
  });

  it('getDashboard aggregates active loans', async () => {
    loansRepo.findAll.mockResolvedValue([
      {
        principalAmount: 100,
        interestAmount: 10,
        outstandingAmount: 50,
        totalPaid: 60,
        status: LoanStatus.ACTIVE,
      },
    ]);
    const stats = await service.getDashboard({
      id: 'a1',
      email: 'a@test',
      role: UserRole.ADMIN,
    });
    expect(stats.activeLoansCount).toBe(1);
    expect(stats.totalPrincipalLoaned).toBe(100);
  });

  it('getCapitalFundDetailSummary returns null totalAllocated for USER', async () => {
    const fid = new Types.ObjectId();
    capitalFundsRepo.findById.mockResolvedValue({
      _id: fid,
      name: 'F',
      balance: 1000,
    });
    loansRepo.findByOwner.mockResolvedValue([
      {
        principalFundId: fid,
        principalAmount: 10,
        interestAmount: 1,
        outstandingAmount: 5,
        totalPaid: 6,
        status: LoanStatus.ACTIVE,
      },
    ]);
    const d = await service.getCapitalFundDetailSummary(
      { id: 'u1', email: 'u@test', role: UserRole.USER },
      fid.toString(),
    );
    expect(d.totalAllocatedToFieldUsers).toBeNull();
    expect(d.fundBalance).toBe(1000);
  });

  it('getCapitalFundDetailSummary sums allocations for ADMIN', async () => {
    const fid = new Types.ObjectId();
    capitalFundsRepo.findById.mockResolvedValue({
      _id: fid,
      name: 'F',
      balance: 500,
    });
    loansRepo.findAll.mockResolvedValue([]);
    userFundAllocRepo.sumBalanceByFund.mockResolvedValue(123);
    const d = await service.getCapitalFundDetailSummary(
      { id: 'a1', email: 'a@test', role: UserRole.ADMIN },
      fid.toString(),
    );
    expect(d.totalAllocatedToFieldUsers).toBe(123);
  });
});
