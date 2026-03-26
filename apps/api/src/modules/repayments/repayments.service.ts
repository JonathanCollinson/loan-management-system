import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';
import { LoanStatus } from '../../common/enums/loan-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import type { JwtUser } from '../../common/types/jwt-user';
import { Loan } from '../loans/schemas/loan.schema';
import { LoansRepository } from '../loans/loans.repository';
import { UsersRepository } from '../users/users.repository';
import { AddRepaymentInput } from './dto/add-repayment.input';
import { RepaymentObject } from './graphql/repayment.object';
import { RepaymentDocument } from './schemas/repayment.schema';
import { RepaymentsRepository } from './repayments.repository';

@Injectable()
export class RepaymentsService {
  constructor(
    private readonly repaymentsRepo: RepaymentsRepository,
    private readonly loansRepo: LoansRepository,
    private readonly usersRepo: UsersRepository,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  toObject(doc: RepaymentDocument): RepaymentObject {
    return {
      id: doc._id.toString(),
      loanId: doc.loanId.toString(),
      amount: doc.amount,
      paymentDate: doc.paymentDate,
      method: doc.method,
    };
  }

  assertLoanAccess(loanOwnerId: string, actor: JwtUser): void {
    if (actor.role === UserRole.USER && loanOwnerId !== actor.id) {
      throw new ForbiddenException();
    }
  }

  async addRepayment(
    input: AddRepaymentInput,
    actor: JwtUser,
  ): Promise<RepaymentObject> {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const loan = await this.loansRepo.findById(input.loanId, session);
      if (!loan) throw new NotFoundException('Loan not found');

      const ownerId = loan.ownerUserId.toString();
      this.assertLoanAccess(ownerId, actor);

      const paymentDate = input.paymentDate
        ? new Date(input.paymentDate)
        : new Date();

      const newTotalPaid = loan.totalPaid + input.amount;
      const outstandingAmount = Math.max(loan.totalAmount - newTotalPaid, 0);

      const wasPaid = loan.status === LoanStatus.PAID;
      let status = loan.status;
      if (outstandingAmount <= 0) {
        status = LoanStatus.PAID;
      } else {
        const now = new Date();
        status =
          loan.endDate < now && outstandingAmount > 0
            ? LoanStatus.OVERDUE
            : LoanStatus.ACTIVE;
      }

      const repayment = await this.repaymentsRepo.create(
        {
          loanId: new Types.ObjectId(input.loanId),
          amount: input.amount,
          paymentDate,
          method: input.method,
          recordedByUserId: new Types.ObjectId(actor.id),
        },
        session,
      );

      const loanUpdate: Partial<Loan> = {
        totalPaid: newTotalPaid,
        outstandingAmount,
        status,
      };
      if (!wasPaid && status === LoanStatus.PAID) {
        loanUpdate.paidAt = paymentDate;
      }

      await this.loansRepo.updateById(input.loanId, loanUpdate, session);

      await this.usersRepo.incrementWallet(ownerId, input.amount, session);

      await session.commitTransaction();
      return this.toObject(repayment);
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  }

  async listRepayments(actor: JwtUser): Promise<RepaymentObject[]> {
    if (actor.role === UserRole.USER) {
      const loans = await this.loansRepo.findByOwner(actor.id);
      const loanIds = loans.map((l) => l._id as Types.ObjectId);
      const docs = await this.repaymentsRepo.findByOwnerLoanIds(loanIds);
      return docs.map((d) => this.toObject(d));
    }
    const docs = await this.repaymentsRepo.findAll();
    return docs.map((d) => this.toObject(d));
  }

  async listRepaymentsForLoan(
    loanId: string,
    actor: JwtUser,
  ): Promise<RepaymentObject[]> {
    const loan = await this.loansRepo.findById(loanId);
    if (!loan) throw new NotFoundException('Loan not found');
    this.assertLoanAccess(loan.ownerUserId.toString(), actor);
    const docs = await this.repaymentsRepo.findByLoan(loanId);
    return docs.map((d) => this.toObject(d));
  }
}
