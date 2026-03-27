import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CapitalFundsModule } from '../capital-funds/capital-funds.module';
import { LoansModule } from '../loans/loans.module';
import { Repayment, RepaymentSchema } from './schemas/repayment.schema';
import { RepaymentsRepository } from './repayments.repository';
import { RepaymentsResolver } from './repayments.resolver';
import { RepaymentsService } from './repayments.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Repayment.name, schema: RepaymentSchema },
    ]),
    LoansModule,
    CapitalFundsModule,
  ],
  providers: [RepaymentsRepository, RepaymentsService, RepaymentsResolver],
  exports: [RepaymentsRepository, RepaymentsService],
})
export class RepaymentsModule {}
