import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';
import { parseMonth } from '../../common/utils/month-range.util';
import type { JwtUser } from '../../common/types/jwt-user';
import { FundingRepository } from '../funding/funding.repository';
import { LoansRepository } from '../loans/loans.repository';
import {
  MonthlyPrincipalBudgetDetail,
  MonthlyPrincipalBudgetEventObject,
} from './graphql/monthly-principal-budget-event.object';
import { MonthlyPrincipalBudgetRepository } from './monthly-principal-budget.repository';
import { MonthlyPrincipalBudgetEventDocument } from './schemas/monthly-principal-budget-event.schema';

@Injectable()
export class MonthlyPrincipalBudgetService {
  constructor(
    private readonly repo: MonthlyPrincipalBudgetRepository,
    private readonly fundingRepo: FundingRepository,
    private readonly loansRepo: LoansRepository,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  private eventToObject(
    doc: MonthlyPrincipalBudgetEventDocument,
  ): MonthlyPrincipalBudgetEventObject {
    const createdAt = (doc as { createdAt?: Date }).createdAt ?? new Date();
    return {
      id: doc._id.toString(),
      month: doc.month,
      delta: doc.delta,
      previousTotal: doc.previousTotal,
      newTotal: doc.newTotal,
      actorUserId: doc.actorUserId.toString(),
      note: doc.note,
      createdAt,
    };
  }

  async getDetail(month: string): Promise<MonthlyPrincipalBudgetDetail> {
    const { start, end } = parseMonth(month);
    const budget = await this.repo.findByMonth(month);
    const events = await this.repo.listEventsForMonth(month);
    const allocatedTotal = await this.fundingRepo.sumTotalAllocationsInMonth(
      month,
      start,
      end,
    );
    const principalLoanedTotal =
      await this.loansRepo.sumPrincipalCreatedBetween(start, end);

    const totalPrincipal = budget?.totalPrincipal ?? 0;
    const utilization = {
      allocatedTotal,
      principalLoanedTotal,
      remainingVsLoans: totalPrincipal - principalLoanedTotal,
      remainingVsAllocations: totalPrincipal - allocatedTotal,
    };

    return {
      month,
      totalPrincipal,
      note: budget?.note,
      budgetCreatedAt: budget
        ? (budget as { createdAt?: Date }).createdAt
        : undefined,
      budgetUpdatedAt: budget
        ? (budget as { updatedAt?: Date }).updatedAt
        : undefined,
      events: events.map((e) => this.eventToObject(e)),
      utilization,
    };
  }

  /** Used by funding/loans when enforcing caps. */
  async getTotalPrincipalForMonth(month: string): Promise<number | null> {
    const doc = await this.repo.findByMonth(month);
    return doc ? doc.totalPrincipal : null;
  }

  async assertFundingFitsBudget(
    month: string,
    additionalAmount: number,
  ): Promise<void> {
    const cap = await this.getTotalPrincipalForMonth(month);
    if (cap === null) return;
    const { start, end } = parseMonth(month);
    const current = await this.fundingRepo.sumTotalAllocationsInMonth(
      month,
      start,
      end,
    );
    if (current + additionalAmount > cap + 1e-9) {
      throw new BadRequestException(
        `Funding allocations for ${month} would exceed the monthly principal budget (${cap})`,
      );
    }
  }

  async assertLoanFitsBudget(
    month: string,
    additionalPrincipal: number,
  ): Promise<void> {
    const cap = await this.getTotalPrincipalForMonth(month);
    if (cap === null) return;
    const { start, end } = parseMonth(month);
    const current = await this.loansRepo.sumPrincipalCreatedBetween(start, end);
    if (current + additionalPrincipal > cap + 1e-9) {
      throw new BadRequestException(
        `Loan principal for ${month} would exceed the monthly principal budget (${cap})`,
      );
    }
  }

  async setMonthlyPrincipalBudget(
    month: string,
    totalPrincipal: number,
    note: string | undefined,
    actor: JwtUser,
  ): Promise<MonthlyPrincipalBudgetDetail> {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const existing = await this.repo.findByMonth(month, session);
      const previousTotal = existing?.totalPrincipal ?? 0;
      const delta = totalPrincipal - previousTotal;

      await this.repo.upsertTotal(month, totalPrincipal, note, session);

      await this.repo.appendEvent(
        {
          month,
          delta,
          previousTotal,
          newTotal: totalPrincipal,
          actorUserId: new Types.ObjectId(actor.id),
          note,
        },
        session,
      );

      await session.commitTransaction();
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      await session.endSession();
    }

    return this.getDetail(month);
  }

  async increaseMonthlyPrincipalBudget(
    month: string,
    delta: number,
    note: string | undefined,
    actor: JwtUser,
  ): Promise<MonthlyPrincipalBudgetDetail> {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const existing = await this.repo.findByMonth(month, session);
      const previousTotal = existing?.totalPrincipal ?? 0;
      const newTotal = previousTotal + delta;

      await this.repo.upsertTotal(month, newTotal, note, session);

      await this.repo.appendEvent(
        {
          month,
          delta,
          previousTotal,
          newTotal,
          actorUserId: new Types.ObjectId(actor.id),
          note,
        },
        session,
      );

      await session.commitTransaction();
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      await session.endSession();
    }

    return this.getDetail(month);
  }
}
