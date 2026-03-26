import { Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtUser } from '../../common/types/jwt-user';
import { DashboardService } from './dashboard.service';
import { DashboardStats } from './graphql/dashboard-stats.object';

@Resolver()
export class DashboardResolver {
  constructor(private readonly dashboardService: DashboardService) {}

  @Query(() => DashboardStats)
  async dashboard(@CurrentUser() actor: JwtUser): Promise<DashboardStats> {
    return this.dashboardService.getDashboard(actor);
  }
}
