import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { UserRole } from '../../common/enums/user-role.enum';
import type { JwtUser } from '../../common/types/jwt-user';
import { parseMonth } from '../../common/utils/month-range.util';
import { LoansRepository } from '../loans/loans.repository';
import { RepaymentsRepository } from '../repayments/repayments.repository';
import { MonthlyReport } from './graphql/monthly-report.object';

@Injectable()
export class ReportsService {
  constructor(
    private readonly loansRepo: LoansRepository,
    private readonly repaymentsRepo: RepaymentsRepository,
  ) {}

  async monthlyReport(month: string, actor: JwtUser): Promise<MonthlyReport> {
    const { start, end } = parseMonth(month);
    const owner =
      actor.role === UserRole.USER ? actor.id : undefined;

    const loans = await this.loansRepo.findCreatedBetween(start, end, owner);
    const principalLoaned = loans.reduce((s, l) => s + l.principalAmount, 0);

    let repayments;
    if (owner) {
      const loanIds = loans.map((l) => l._id as Types.ObjectId);
      const allOwnerLoans = await this.loansRepo.findByOwner(owner);
      const allIds = allOwnerLoans.map((l) => l._id as Types.ObjectId);
      repayments = await this.repaymentsRepo.findPaymentsBetween(
        start,
        end,
        allIds,
      );
    } else {
      repayments = await this.repaymentsRepo.findPaymentsBetween(start, end);
    }

    const paymentsReceived = repayments.reduce((s, r) => s + r.amount, 0);

    return {
      month,
      loansIssued: loans.length,
      principalLoaned,
      repaymentsCount: repayments.length,
      paymentsReceived,
    };
  }

  async monthlyReportCsv(month: string, actor: JwtUser): Promise<string> {
    const r = await this.monthlyReport(month, actor);
    const headers = [
      'month',
      'loansIssued',
      'principalLoaned',
      'repaymentsCount',
      'paymentsReceived',
    ];
    const row = [
      r.month,
      String(r.loansIssued),
      String(r.principalLoaned),
      String(r.repaymentsCount),
      String(r.paymentsReceived),
    ];
    return `${headers.join(',')}\n${row.join(',')}\n`;
  }
}
