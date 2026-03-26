import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LoansModule } from '../loans/loans.module';
import { MonthlyPrincipalBudgetModule } from '../monthly-principal-budget/monthly-principal-budget.module';
import { UsersModule } from '../users/users.module';
import {
  FundingTransfer,
  FundingTransferSchema,
} from './schemas/funding-transfer.schema';
import { FundingRepository } from './funding.repository';
import { FundingResolver } from './funding.resolver';
import { FundingService } from './funding.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FundingTransfer.name, schema: FundingTransferSchema },
    ]),
    UsersModule,
    LoansModule,
    forwardRef(() => MonthlyPrincipalBudgetModule),
  ],
  providers: [FundingRepository, FundingService, FundingResolver],
  exports: [FundingService, FundingRepository],
})
export class FundingModule {}
