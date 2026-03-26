import { Module } from '@nestjs/common';
import { LoansModule } from '../loans/loans.module';
import { RepaymentsModule } from '../repayments/repayments.module';
import { ReportsResolver } from './reports.resolver';
import { ReportsService } from './reports.service';

@Module({
  imports: [LoansModule, RepaymentsModule],
  providers: [ReportsService, ReportsResolver],
})
export class ReportsModule {}
