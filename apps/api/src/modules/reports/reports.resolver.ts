import { Args, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtUser } from '../../common/types/jwt-user';
import { MonthlyReport } from './graphql/monthly-report.object';
import { ReportsService } from './reports.service';

@Resolver()
export class ReportsResolver {
  constructor(private readonly reportsService: ReportsService) {}

  @Query(() => MonthlyReport)
  async monthlyReport(
    @Args('month') month: string,
    @CurrentUser() actor: JwtUser,
  ): Promise<MonthlyReport> {
    return this.reportsService.monthlyReport(month, actor);
  }

  @Query(() => String)
  async monthlyReportCsv(
    @Args('month') month: string,
    @CurrentUser() actor: JwtUser,
  ): Promise<string> {
    return this.reportsService.monthlyReportCsv(month, actor);
  }

  /** Placeholder until Phase 3 (email/push reminders). */
  @Query(() => String)
  notificationsStub(): string {
    return 'not_implemented';
  }
}
