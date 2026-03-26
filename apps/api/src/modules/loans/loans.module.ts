import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BorrowersModule } from '../borrowers/borrowers.module';
import { SystemConfigModule } from '../system-config/system-config.module';
import { UsersModule } from '../users/users.module';
import { Loan, LoanSchema } from './schemas/loan.schema';
import { LoansRepository } from './loans.repository';
import { LoansResolver } from './loans.resolver';
import { LoansService } from './loans.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Loan.name, schema: LoanSchema }]),
    BorrowersModule,
    UsersModule,
    SystemConfigModule,
  ],
  providers: [LoansRepository, LoansService, LoansResolver],
  exports: [LoansRepository, LoansService],
})
export class LoansModule {}
