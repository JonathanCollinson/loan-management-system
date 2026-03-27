import { Args, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtUser } from '../../common/types/jwt-user';
import { DashboardService } from './dashboard.service';
import { CapitalFundDetailSummary } from './graphql/capital-fund-detail-summary.object';
import { CapitalFundSummary } from './graphql/capital-fund-summary.object';
import { DashboardStats } from './graphql/dashboard-stats.object';

@Resolver()
export class DashboardResolver {
  constructor(private readonly dashboardService: DashboardService) {}

  @Query(() => DashboardStats)
  async dashboard(@CurrentUser() actor: JwtUser): Promise<DashboardStats> {
    return this.dashboardService.getDashboard(actor);
  }

  @Query(() => [CapitalFundSummary])
  async capitalFundSummaries(
    @CurrentUser() actor: JwtUser,
  ): Promise<CapitalFundSummary[]> {
    return this.dashboardService.getCapitalFundSummaries(actor);
  }

  @Query(() => CapitalFundDetailSummary)
  async capitalFundDetailSummary(
    @Args('fundId') fundId: string,
    @CurrentUser() actor: JwtUser,
  ): Promise<CapitalFundDetailSummary> {
    return this.dashboardService.getCapitalFundDetailSummary(actor, fundId);
  }
}
