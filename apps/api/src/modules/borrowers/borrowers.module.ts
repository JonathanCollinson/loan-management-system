import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Loan, LoanSchema } from '../loans/schemas/loan.schema';
import { UsersModule } from '../users/users.module';
import { BorrowersRepository } from './borrowers.repository';
import { BorrowersResolver } from './borrowers.resolver';
import { BorrowersService } from './borrowers.service';
import { Borrower, BorrowerSchema } from './schemas/borrower.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Borrower.name, schema: BorrowerSchema },
      { name: Loan.name, schema: LoanSchema },
    ]),
    UsersModule,
  ],
  providers: [BorrowersRepository, BorrowersService, BorrowersResolver],
  exports: [BorrowersRepository, BorrowersService],
})
export class BorrowersModule {}
