import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '../../common/enums/user-role.enum';
import { LoansRepository } from '../loans/loans.repository';
import { RepaymentsRepository } from '../repayments/repayments.repository';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let service: ReportsService;
  const loansRepo = {
    findCreatedBetween: jest.fn(),
    findByOwner: jest.fn(),
  };
  const repaymentsRepo = {
    findPaymentsBetween: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: LoansRepository, useValue: loansRepo },
        { provide: RepaymentsRepository, useValue: repaymentsRepo },
      ],
    }).compile();
    service = module.get(ReportsService);
  });

  it('monthlyReport scopes loans to owner for USER', async () => {
    loansRepo.findCreatedBetween.mockResolvedValue([]);
    loansRepo.findByOwner.mockResolvedValue([]);
    repaymentsRepo.findPaymentsBetween.mockResolvedValue([]);

    await service.monthlyReport('2026-03', {
      id: 'u1',
      email: 'u@test',
      role: UserRole.USER,
    });

    expect(loansRepo.findCreatedBetween).toHaveBeenCalled();
    const firstCall = loansRepo.findCreatedBetween.mock.calls[0] as [
      unknown,
      unknown,
      string,
    ];
    expect(firstCall[2]).toBe('u1');
  });

  it('monthlyReportCsv includes header row', async () => {
    loansRepo.findCreatedBetween.mockResolvedValue([]);
    repaymentsRepo.findPaymentsBetween.mockResolvedValue([]);

    const csv = await service.monthlyReportCsv('2026-03', {
      id: 'a1',
      email: 'a@test',
      role: UserRole.ADMIN,
    });

    expect(csv).toContain('month');
    expect(csv).toContain('2026-03');
  });
});
