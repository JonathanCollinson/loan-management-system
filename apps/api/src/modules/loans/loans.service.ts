import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';
import { BorrowerAudience } from '../../common/enums/borrower-audience.enum';
import { InterestType } from '../../common/enums/interest-type.enum';
import { LoanStatus } from '../../common/enums/loan-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import type { JwtUser } from '../../common/types/jwt-user';
import { formatMonthFromDate } from '../../common/utils/format-month-from-date.util';
import { withTransactionOrFallback } from '../../common/utils/mongo-transaction.util';
import { resolveLenderWalletUserId } from './lender-wallet.util';
import { MonthlyPrincipalBudgetService } from '../monthly-principal-budget/monthly-principal-budget.service';
import { BorrowersRepository } from '../borrowers/borrowers.repository';
import { SystemConfigService } from '../system-config/system-config.service';
import { UsersRepository } from '../users/users.repository';
import { CreateLoanInput } from './dto/create-loan.input';
import { LoanObject } from './graphql/loan.object';
import { LoanDocument } from './schemas/loan.schema';
import { LoansRepository } from './loans.repository';

function addMonths(d: Date, months: number): Date {
  const out = new Date(d.getTime());
  out.setMonth(out.getMonth() + months);
  return out;
}

@Injectable()
export class LoansService {
  constructor(
    private readonly loansRepo: LoansRepository,
    private readonly borrowersRepo: BorrowersRepository,
    private readonly usersRepo: UsersRepository,
    private readonly systemConfigService: SystemConfigService,
    @InjectConnection() private readonly connection: Connection,
    @Inject(forwardRef(() => MonthlyPrincipalBudgetService))
    private readonly monthlyPrincipalBudgetService: MonthlyPrincipalBudgetService,
  ) {}

  toObject(doc: LoanDocument): LoanObject {
    return {
      id: doc._id.toString(),
      borrowerId: doc.borrowerId.toString(),
      ownerUserId: doc.ownerUserId.toString(),
      principalAmount: doc.principalAmount,
      interestRate: doc.interestRate,
      interestType: doc.interestType,
      interestAmount: doc.interestAmount,
      totalAmount: doc.totalAmount,
      termMonths: doc.termMonths,
      startDate: doc.startDate,
      endDate: doc.endDate,
      monthlyInstallment: doc.monthlyInstallment,
      status: doc.status,
      totalPaid: doc.totalPaid,
      outstandingAmount: doc.outstandingAmount,
      paidAt: doc.paidAt,
    };
  }

  async syncLoanStatus(loan: LoanDocument): Promise<LoanDocument> {
    if (loan.status === LoanStatus.PAID) return loan;

    if (loan.outstandingAmount <= 0) {
      const updated = await this.loansRepo.updateById(loan._id.toString(), {
        status: LoanStatus.PAID,
        outstandingAmount: 0,
        paidAt: loan.paidAt ?? new Date(),
      });
      return updated ?? loan;
    }

    const now = new Date();
    const nextStatus =
      loan.endDate < now && loan.outstandingAmount > 0
        ? LoanStatus.OVERDUE
        : LoanStatus.ACTIVE;

    if (nextStatus !== loan.status) {
      const updated = await this.loansRepo.updateById(loan._id.toString(), {
        status: nextStatus,
      });
      return updated ?? loan;
    }
    return loan;
  }

  async createLoan(
    input: CreateLoanInput,
    actor: JwtUser,
  ): Promise<LoanObject> {
    if (input.interestType !== InterestType.FLAT) {
      throw new BadRequestException('Only FLAT interest is supported');
    }

    const borrower = await this.borrowersRepo.findById(input.borrowerId);
    if (!borrower) throw new NotFoundException('Borrower not found');

    const borrowerOwnerId = borrower.createdByUserId.toString();
    const audience = borrower.audience ?? BorrowerAudience.OWNER_ONLY;

    if (actor.role === UserRole.USER) {
      if (audience === BorrowerAudience.ADMINS_ONLY) {
        throw new ForbiddenException();
      }
      if (audience !== BorrowerAudience.ALL_FIELD_USERS) {
        if (borrowerOwnerId !== actor.id) {
          throw new ForbiddenException();
        }
      }
    }

    const loanOwnerUserId =
      actor.role === UserRole.USER &&
      audience === BorrowerAudience.ALL_FIELD_USERS
        ? actor.id
        : borrowerOwnerId;

    const principal = input.principalAmount;
    let interestRate: number;
    if (actor.role === UserRole.SUPER_ADMIN) {
      interestRate =
        input.interestRate != null
          ? input.interestRate
          : await this.systemConfigService.getDefaultInterestRate();
    } else {
      interestRate = await this.systemConfigService.getDefaultInterestRate();
    }
    const interestAmount = principal * (interestRate / 100);
    const totalAmount = principal + interestAmount;
    const termMonths = input.termMonths;
    const startDate = input.startDate ? new Date(input.startDate) : new Date();
    const endDate = addMonths(startDate, termMonths);
    const monthlyInstallment = totalAmount / termMonths;

    const budgetMonth = formatMonthFromDate(startDate);
    await this.monthlyPrincipalBudgetService.assertLoanFitsBudget(
      budgetMonth,
      principal,
    );

    const lenderWalletUserId = resolveLenderWalletUserId(
      actor,
      borrowerOwnerId,
      audience,
    );

    return withTransactionOrFallback(this.connection, async (session) => {
      const debited = await this.usersRepo.decrementWalletIfGte(
        lenderWalletUserId,
        principal,
        session ?? undefined,
      );
      if (!debited) {
        throw new BadRequestException(
          'Insufficient wallet balance for this principal',
        );
      }

      const loan = await this.loansRepo.create(
        {
          borrowerId: new Types.ObjectId(input.borrowerId),
          ownerUserId: new Types.ObjectId(loanOwnerUserId),
          principalAmount: principal,
          interestRate,
          interestType: InterestType.FLAT,
          interestAmount,
          totalAmount,
          termMonths,
          startDate,
          endDate,
          monthlyInstallment,
          status: LoanStatus.ACTIVE,
          totalPaid: 0,
          outstandingAmount: totalAmount,
        },
        session ?? undefined,
      );

      return this.toObject(loan);
    });
  }

  async listLoans(actor: JwtUser): Promise<LoanObject[]> {
    const docs =
      actor.role === UserRole.USER
        ? await this.loansRepo.findByOwner(actor.id)
        : await this.loansRepo.findAll();

    const out: LoanObject[] = [];
    for (const doc of docs) {
      const synced = await this.syncLoanStatus(doc);
      out.push(this.toObject(synced));
    }
    return out;
  }

  async getLoan(id: string, actor: JwtUser): Promise<LoanObject> {
    const doc = await this.loansRepo.findById(id);
    if (!doc) throw new NotFoundException('Loan not found');

    if (
      actor.role === UserRole.USER &&
      doc.ownerUserId.toString() !== actor.id
    ) {
      throw new ForbiddenException();
    }

    const synced = await this.syncLoanStatus(doc);
    return this.toObject(synced);
  }

  async getLoanForOwnerCheck(id: string): Promise<LoanDocument | null> {
    return this.loansRepo.findById(id);
  }
}
