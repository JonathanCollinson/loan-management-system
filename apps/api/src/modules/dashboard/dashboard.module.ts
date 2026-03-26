import { Module } from '@nestjs/common';
import { LoansModule } from '../loans/loans.module';
import { DashboardResolver } from './dashboard.resolver';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [LoansModule],
  providers: [DashboardService, DashboardResolver],
})
export class DashboardModule {}
