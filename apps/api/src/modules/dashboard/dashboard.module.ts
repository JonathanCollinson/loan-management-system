import { Module } from '@nestjs/common';
import { CapitalFundsModule } from '../capital-funds/capital-funds.module';
import { FundingModule } from '../funding/funding.module';
import { LoansModule } from '../loans/loans.module';
import { DashboardResolver } from './dashboard.resolver';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [LoansModule, CapitalFundsModule, FundingModule],
  providers: [DashboardService, DashboardResolver],
})
export class DashboardModule {}
