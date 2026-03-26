import { Test, TestingModule } from '@nestjs/testing';
import { LoanStatus } from '../../common/enums/loan-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import { LoansRepository } from '../loans/loans.repository';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  const loansRepo = {
    findByOwner: jest.fn(),
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: LoansRepository, useValue: loansRepo },
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
});
