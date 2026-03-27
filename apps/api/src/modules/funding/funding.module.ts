import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CapitalFundsModule } from '../capital-funds/capital-funds.module';
import { LoansModule } from '../loans/loans.module';
import { MonthlyPrincipalBudgetModule } from '../monthly-principal-budget/monthly-principal-budget.module';
import { UsersModule } from '../users/users.module';
import {
  FundingTransfer,
  FundingTransferSchema,
} from './schemas/funding-transfer.schema';
import {
  UserFundAllocation,
  UserFundAllocationSchema,
} from './schemas/user-fund-allocation.schema';
import { FundingRepository } from './funding.repository';
import { FundingResolver } from './funding.resolver';
import { FundingService } from './funding.service';
import { UserFundAllocationsRepository } from './user-fund-allocations.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FundingTransfer.name, schema: FundingTransferSchema },
      { name: UserFundAllocation.name, schema: UserFundAllocationSchema },
    ]),
    forwardRef(() => CapitalFundsModule),
    UsersModule,
    forwardRef(() => LoansModule),
    forwardRef(() => MonthlyPrincipalBudgetModule),
  ],
  providers: [
    FundingRepository,
    UserFundAllocationsRepository,
    FundingService,
    FundingResolver,
  ],
  exports: [FundingService, FundingRepository, UserFundAllocationsRepository],
})
export class FundingModule {}
