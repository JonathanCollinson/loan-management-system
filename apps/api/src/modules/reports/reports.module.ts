import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BorrowersModule } from '../borrowers/borrowers.module';
import { LoansModule } from '../loans/loans.module';
import { RepaymentsModule } from '../repayments/repayments.module';
import { BorrowerSummaryExportController } from './borrower-summary-export.controller';
import { BorrowerSummaryExportService } from './borrower-summary-export.service';
import { ReportsResolver } from './reports.resolver';
import { ReportsService } from './reports.service';

@Module({
  imports: [AuthModule, BorrowersModule, LoansModule, RepaymentsModule],
  controllers: [BorrowerSummaryExportController],
  providers: [ReportsService, ReportsResolver, BorrowerSummaryExportService],
})
export class ReportsModule {}
