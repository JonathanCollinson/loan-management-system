import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  OnModuleInit,
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
import { parseMonth } from '../../common/utils/month-range.util';
import { withTransactionOrFallback } from '../../common/utils/mongo-transaction.util';
import { CapitalFundsService } from '../capital-funds/capital-funds.service';
import { CapitalFundsRepository } from '../capital-funds/capital-funds.repository';
import { UserFundAllocationsRepository } from '../funding/user-fund-allocations.repository';
import { MonthlyPrincipalBudgetService } from '../monthly-principal-budget/monthly-principal-budget.service';
import { BorrowersRepository } from '../borrowers/borrowers.repository';
import { SystemConfigService } from '../system-config/system-config.service';
import { UsersRepository } from '../users/users.repository';
import { CreateLoanInput } from './dto/create-loan.input';
import { RolloverLoanInput } from './dto/rollover-loan.input';
import { UpdateLoanInput } from './dto/update-loan.input';
import { LoanObject } from './graphql/loan.object';
import { LoanDocument } from './schemas/loan.schema';
import { LoansRepository } from './loans.repository';

function addMonths(d: Date, months: number): Date {
  const out = new Date(d.getTime());
  out.setMonth(out.getMonth() + months);
  return out;
}

@Injectable()
export class LoansService implements OnModuleInit {
  constructor(
    private readonly loansRepo: LoansRepository,
    private readonly borrowersRepo: BorrowersRepository,
    private readonly systemConfigService: SystemConfigService,
    private readonly capitalFundsService: CapitalFundsService,
    private readonly capitalFundsRepo: CapitalFundsRepository,
    private readonly userFundAllocRepo: UserFundAllocationsRepository,
    private readonly usersRepo: UsersRepository,
    @InjectConnection() private readonly connection: Connection,
    @Inject(forwardRef(() => MonthlyPrincipalBudgetService))
    private readonly monthlyPrincipalBudgetService: MonthlyPrincipalBudgetService,
  ) {}

  async onModuleInit(): Promise<void> {
    const fundId = await this.capitalFundsService.ensureLegacyFundExists();
    await this.loansRepo.updateMany(
      {
        $or: [
          { principalFundId: { $exists: false } },
          { principalFundId: null },
        ],
      },
      {
        $set: {
          principalFundId: new Types.ObjectId(fundId),
          rolloverCount: 0,
        },
      },
    );
  }

  toObject(doc: LoanDocument): LoanObject {
    return {
      id: doc._id.toString(),
      borrowerId: doc.borrowerId.toString(),
      ownerUserId: doc.ownerUserId.toString(),
      principalFundId: doc.principalFundId?.toString() ?? '',
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
      rolloverCount: doc.rolloverCount ?? 0,
      currentPeriodEnd: doc.currentPeriodEnd,
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

    const fund = await this.capitalFundsRepo.findById(input.principalFundId);
    if (!fund || !fund.isActive) {
      throw new NotFoundException('Capital fund not found or inactive');
    }

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
    this.capitalFundsService.assertPrincipalWithinPolicy(fund, principal);

    const systemRate = await this.systemConfigService.getDefaultInterestRate();
    const fundDefault =
      this.capitalFundsService.resolveDefaultInterestRatePercent(
        fund,
        systemRate,
      ) ?? systemRate;

    let interestRate: number;
    if (actor.role === UserRole.SUPER_ADMIN && input.interestRate != null) {
      interestRate = input.interestRate;
    } else {
      interestRate = fundDefault;
    }

    const interestAmount = principal * (interestRate / 100);
    const totalAmount = principal + interestAmount;
    const systemTerm = await this.systemConfigService.getDefaultTermMonths();
    const fundTermDefault =
      this.capitalFundsService.resolveDefaultTermMonths(fund);
    const defaultTermMonths = fundTermDefault ?? systemTerm;
    const termMonths = Math.max(1, input.termMonths ?? defaultTermMonths);

    const startDate = input.startDate ? new Date(input.startDate) : new Date();
    const endDate = addMonths(startDate, termMonths);
    const monthlyInstallment = totalAmount / termMonths;

    const budgetMonth = formatMonthFromDate(startDate);
    await this.monthlyPrincipalBudgetService.assertLoanFitsBudget(
      budgetMonth,
      principal,
    );

    return withTransactionOrFallback(this.connection, async (session) => {
      if (actor.role === UserRole.USER) {
        const allocOk = await this.userFundAllocRepo.decrementBalanceIfGte(
          loanOwnerUserId,
          input.principalFundId,
          principal,
          session ?? undefined,
        );
        if (!allocOk) {
          throw new BadRequestException(
            'Insufficient allocation from this capital fund. Ask an admin to record funding from this fund to your account.',
          );
        }
        const walletDoc = await this.usersRepo.decrementWalletIfGte(
          loanOwnerUserId,
          principal,
          session ?? undefined,
        );
        if (!walletDoc) {
          await this.userFundAllocRepo.incrementBalance(
            loanOwnerUserId,
            input.principalFundId,
            principal,
            session ?? undefined,
          );
          throw new BadRequestException('Insufficient wallet balance');
        }
      }

      const loan = await this.loansRepo.create(
        {
          borrowerId: new Types.ObjectId(input.borrowerId),
          ownerUserId: new Types.ObjectId(loanOwnerUserId),
          principalFundId: new Types.ObjectId(input.principalFundId),
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
          rolloverCount: 0,
          currentPeriodEnd: endDate,
        },
        session ?? undefined,
      );

      await this.capitalFundsService.disburseForLoan(
        input.principalFundId,
        principal,
        loan._id.toString(),
        actor.id,
        session ?? undefined,
      );

      return this.toObject(loan);
    });
  }

  async listLoans(
    actor: JwtUser,
    principalFundId?: string | null,
    month?: string | null,
  ): Promise<LoanObject[]> {
    await this.capitalFundsService.assertCanUsePrincipalFundForFilter(
      actor,
      principalFundId,
    );

    const docs =
      actor.role === UserRole.USER
        ? await this.loansRepo.findByOwner(actor.id)
        : await this.loansRepo.findAll();

    let filtered =
      principalFundId != null && principalFundId !== ''
        ? docs.filter((d) => d.principalFundId?.toString() === principalFundId)
        : docs;

    if (month != null && month !== '') {
      const { start, end } = parseMonth(month);
      filtered = filtered.filter((d) => {
        const c = (d as LoanDocument & { createdAt?: Date }).createdAt;
        if (!c) return false;
        const t = c.getTime();
        return t >= start.getTime() && t <= end.getTime();
      });
    }

    const out: LoanObject[] = [];
    for (const doc of filtered) {
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

  async updateLoan(
    input: UpdateLoanInput,
    actor: JwtUser,
  ): Promise<LoanObject> {
    if (actor.role === UserRole.USER) {
      throw new ForbiddenException();
    }
    const loan = await this.loansRepo.findById(input.loanId);
    if (!loan) throw new NotFoundException('Loan not found');
    if (loan.status === LoanStatus.PAID) {
      throw new BadRequestException('Cannot update a paid loan');
    }
    if (input.interestRate == null && input.termMonths == null) {
      const synced = await this.syncLoanStatus(loan);
      return this.toObject(synced);
    }
    if (loan.totalPaid > 0) {
      throw new BadRequestException(
        'Cannot change interest or term after repayments have been recorded',
      );
    }
    if (input.interestRate != null && actor.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only Super Admin can change interest rate');
    }
    let interestRate = loan.interestRate;
    let termMonths = loan.termMonths;
    if (input.interestRate != null) {
      interestRate = input.interestRate;
    }
    if (input.termMonths != null) {
      termMonths = Math.max(1, input.termMonths);
    }
    const principal = loan.principalAmount;
    const interestAmount = principal * (interestRate / 100);
    const totalAmount = principal + interestAmount;
    const startDate = loan.startDate;
    const endDate = addMonths(startDate, termMonths);
    const monthlyInstallment = totalAmount / termMonths;
    const outstandingAmount = totalAmount - loan.totalPaid;
    const updated = await this.loansRepo.updateById(loan._id.toString(), {
      interestRate,
      interestAmount,
      totalAmount,
      termMonths,
      endDate,
      monthlyInstallment,
      outstandingAmount,
      currentPeriodEnd: endDate,
    });
    const doc = updated ?? loan;
    const synced = await this.syncLoanStatus(doc);
    return this.toObject(synced);
  }

  async rolloverLoan(
    input: RolloverLoanInput,
    actor: JwtUser,
  ): Promise<LoanObject> {
    const loan = await this.loansRepo.findById(input.loanId);
    if (!loan) throw new NotFoundException('Loan not found');
    if (loan.status === LoanStatus.PAID || loan.outstandingAmount <= 0) {
      throw new BadRequestException('Loan has no outstanding balance to roll');
    }
    if (
      actor.role === UserRole.USER &&
      loan.ownerUserId.toString() !== actor.id
    ) {
      throw new ForbiddenException();
    }
    const globalMode = await this.systemConfigService.getGlobalRolloverMode();
    const fund = loan.principalFundId
      ? await this.capitalFundsRepo.findById(loan.principalFundId.toString())
      : null;
    const effectiveMode = this.capitalFundsService.effectiveRolloverMode(
      fund,
      globalMode,
    );
    if (effectiveMode === 'MANUAL' && actor.role === UserRole.USER) {
      throw new ForbiddenException(
        'This fund requires an administrator to process rollover',
      );
    }
    const policyPct = fund?.policy?.rolloverInterestOnOutstandingPercent;
    const pct =
      input.interestPercentOnOutstanding ??
      (policyPct != null && policyPct > 0 ? policyPct : 0);
    let extraInterest = 0;
    if (pct > 0) {
      extraInterest = loan.outstandingAmount * (pct / 100);
    }
    const newInterestAmount = loan.interestAmount + extraInterest;
    const newTotalAmount = loan.totalAmount + extraInterest;
    const newOutstanding = loan.outstandingAmount + extraInterest;
    const newTermMonths = loan.termMonths + 1;
    const newEndDate = addMonths(loan.endDate, 1);
    const newMonthlyInstallment = newTotalAmount / newTermMonths;
    const newRolloverCount = (loan.rolloverCount ?? 0) + 1;
    const updated = await this.loansRepo.updateById(loan._id.toString(), {
      interestAmount: newInterestAmount,
      totalAmount: newTotalAmount,
      outstandingAmount: newOutstanding,
      termMonths: newTermMonths,
      endDate: newEndDate,
      monthlyInstallment: newMonthlyInstallment,
      rolloverCount: newRolloverCount,
      currentPeriodEnd: newEndDate,
    });
    const doc = updated ?? loan;
    const synced = await this.syncLoanStatus(doc);
    return this.toObject(synced);
  }
}
