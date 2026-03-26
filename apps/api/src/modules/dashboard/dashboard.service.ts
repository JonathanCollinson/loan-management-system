import { Injectable } from '@nestjs/common';
import { LoanStatus } from '../../common/enums/loan-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import type { JwtUser } from '../../common/types/jwt-user';
import { LoansRepository } from '../loans/loans.repository';
import { DashboardStats } from './graphql/dashboard-stats.object';

@Injectable()
export class DashboardService {
  constructor(private readonly loansRepo: LoansRepository) {}

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
}
