import { Injectable, NotFoundException } from '@nestjs/common';
import { LoanStatus } from '../../common/enums/loan-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import type { JwtUser } from '../../common/types/jwt-user';
import { CapitalFundsRepository } from '../capital-funds/capital-funds.repository';
import { UserFundAllocationsRepository } from '../funding/user-fund-allocations.repository';
import { LoansRepository } from '../loans/loans.repository';
import { CapitalFundDetailSummary } from './graphql/capital-fund-detail-summary.object';
import { CapitalFundSummary } from './graphql/capital-fund-summary.object';
import { DashboardStats } from './graphql/dashboard-stats.object';

@Injectable()
export class DashboardService {
  constructor(
    private readonly loansRepo: LoansRepository,
    private readonly capitalFundsRepo: CapitalFundsRepository,
    private readonly userFundAllocRepo: UserFundAllocationsRepository,
  ) {}

  async getDashboard(actor: JwtUser): Promise<DashboardStats> {
    const loans =
      actor.role === UserRole.USER
        ? await this.loansRepo.findByOwner(actor.id)
        : await this.loansRepo.findAll();

    let totalPrincipalLoaned = 0;
    let totalInterestExpected = 0;
    let totalOutstanding = 0;
    let totalCollected = 0;
    let activeLoansCount = 0;

    for (const l of loans) {
      totalPrincipalLoaned += l.principalAmount;
      totalInterestExpected += l.interestAmount;
      totalOutstanding += l.outstandingAmount;
      totalCollected += l.totalPaid;
      if (l.status === LoanStatus.ACTIVE || l.status === LoanStatus.OVERDUE) {
        activeLoansCount += 1;
      }
    }

    return {
      totalPrincipalLoaned,
      totalInterestExpected,
      totalOutstanding,
      totalCollected,
      activeLoansCount,
    };
  }

  async getCapitalFundSummaries(actor: JwtUser): Promise<CapitalFundSummary[]> {
    const loans =
      actor.role === UserRole.USER
        ? await this.loansRepo.findByOwner(actor.id)
        : await this.loansRepo.findAll();

    const funds = await this.capitalFundsRepo.findAll();
    const nameById = new Map(funds.map((f) => [f._id.toString(), f.name]));

    type Agg = {
      principalLoaned: number;
      totalInterestExpected: number;
      totalOutstanding: number;
      totalCollected: number;
      activeLoansCount: number;
    };
    const byFund = new Map<string, Agg>();

    for (const l of loans) {
      const fid = l.principalFundId?.toString();
      if (!fid) continue;
      if (!byFund.has(fid)) {
        byFund.set(fid, {
          principalLoaned: 0,
          totalInterestExpected: 0,
          totalOutstanding: 0,
          totalCollected: 0,
          activeLoansCount: 0,
        });
      }
      const a = byFund.get(fid)!;
      a.principalLoaned += l.principalAmount;
      a.totalInterestExpected += l.interestAmount;
      a.totalOutstanding += l.outstandingAmount;
      a.totalCollected += l.totalPaid;
      if (l.status === LoanStatus.ACTIVE || l.status === LoanStatus.OVERDUE) {
        a.activeLoansCount += 1;
      }
    }

    return Array.from(byFund.entries()).map(([fundId, a]) => ({
      fundId,
      fundName: nameById.get(fundId) ?? 'Unknown fund',
      principalLoaned: a.principalLoaned,
      totalInterestExpected: a.totalInterestExpected,
      totalOutstanding: a.totalOutstanding,
      totalCollected: a.totalCollected,
      activeLoansCount: a.activeLoansCount,
    }));
  }

  async getCapitalFundDetailSummary(
    actor: JwtUser,
    fundId: string,
  ): Promise<CapitalFundDetailSummary> {
    const fund = await this.capitalFundsRepo.findById(fundId);
    if (!fund) {
      throw new NotFoundException('Capital fund not found');
    }

    const loans =
      actor.role === UserRole.USER
        ? await this.loansRepo.findByOwner(actor.id)
        : await this.loansRepo.findAll();

    let principalLoaned = 0;
    let totalInterestExpected = 0;
    let totalOutstanding = 0;
    let totalCollected = 0;
    let activeLoansCount = 0;

    for (const l of loans) {
      if (l.principalFundId?.toString() !== fundId) continue;
      principalLoaned += l.principalAmount;
      totalInterestExpected += l.interestAmount;
      totalOutstanding += l.outstandingAmount;
      totalCollected += l.totalPaid;
      if (l.status === LoanStatus.ACTIVE || l.status === LoanStatus.OVERDUE) {
        activeLoansCount += 1;
      }
    }

    const totalAllocatedToFieldUsers =
      actor.role === UserRole.USER
        ? null
        : await this.userFundAllocRepo.sumBalanceByFund(fundId);

    return {
      fundId: fund._id.toString(),
      fundName: fund.name,
      fundBalance: fund.balance,
      totalAllocatedToFieldUsers,
      principalLoaned,
      totalInterestExpected,
      totalOutstanding,
      totalCollected,
      activeLoansCount,
    };
  }
}
