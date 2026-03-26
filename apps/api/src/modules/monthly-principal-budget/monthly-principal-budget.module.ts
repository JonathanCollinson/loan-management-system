import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FundingModule } from '../funding/funding.module';
import { LoansModule } from '../loans/loans.module';
import { MonthlyPrincipalBudgetRepository } from './monthly-principal-budget.repository';
import { MonthlyPrincipalBudgetResolver } from './monthly-principal-budget.resolver';
import { MonthlyPrincipalBudgetService } from './monthly-principal-budget.service';
import {
  MonthlyPrincipalBudget,
  MonthlyPrincipalBudgetSchema,
} from './schemas/monthly-principal-budget.schema';
import {
  MonthlyPrincipalBudgetEvent,
  MonthlyPrincipalBudgetEventSchema,
} from './schemas/monthly-principal-budget-event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: MonthlyPrincipalBudget.name,
        schema: MonthlyPrincipalBudgetSchema,
      },
      {
        name: MonthlyPrincipalBudgetEvent.name,
        schema: MonthlyPrincipalBudgetEventSchema,
      },
    ]),
    forwardRef(() => FundingModule),
    forwardRef(() => LoansModule),
  ],
  providers: [
    MonthlyPrincipalBudgetRepository,
    MonthlyPrincipalBudgetService,
    MonthlyPrincipalBudgetResolver,
  ],
  exports: [MonthlyPrincipalBudgetService],
})
export class MonthlyPrincipalBudgetModule {}
