import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FundingModule } from '../funding/funding.module';
import { CapitalFund, CapitalFundSchema } from './schemas/capital-fund.schema';
import {
  FundLedgerEntry,
  FundLedgerEntrySchema,
} from './schemas/fund-ledger-entry.schema';
import { CapitalFundsRepository } from './capital-funds.repository';
import { CapitalFundsService } from './capital-funds.service';
import { CapitalFundsResolver } from './capital-funds.resolver';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CapitalFund.name, schema: CapitalFundSchema },
      { name: FundLedgerEntry.name, schema: FundLedgerEntrySchema },
    ]),
    forwardRef(() => FundingModule),
  ],
  providers: [
    CapitalFundsRepository,
    CapitalFundsService,
    CapitalFundsResolver,
  ],
  exports: [CapitalFundsRepository, CapitalFundsService],
})
export class CapitalFundsModule {}
