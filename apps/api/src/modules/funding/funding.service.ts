import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { UserRole } from '../../common/enums/user-role.enum';
import type { JwtUser } from '../../common/types/jwt-user';
import { parseMonth } from '../../common/utils/month-range.util';
import { MonthlyPrincipalBudgetService } from '../monthly-principal-budget/monthly-principal-budget.service';
import { LoansRepository } from '../loans/loans.repository';
import { UsersRepository } from '../users/users.repository';
import { RecordFundingInput } from './dto/record-funding.input';
import { FundingTransferObject } from './graphql/funding-transfer.object';
import {
  FundingUtilizationPayload,
  FundingUtilizationRow,
} from './graphql/funding-utilization.object';
import { FundingTransferDocument } from './schemas/funding-transfer.schema';
import { FundingRepository } from './funding.repository';

@Injectable()
export class FundingService {
  constructor(
    private readonly fundingRepo: FundingRepository,
    private readonly usersRepo: UsersRepository,
    private readonly loansRepo: LoansRepository,
    @Inject(forwardRef(() => MonthlyPrincipalBudgetService))
    private readonly monthlyPrincipalBudgetService: MonthlyPrincipalBudgetService,
  ) {}

  toObject(doc: FundingTransferDocument): FundingTransferObject {
    const createdAt = (doc as { createdAt?: Date }).createdAt ?? new Date();
    return {
      id: doc._id.toString(),
      adminUserId: doc.adminUserId.toString(),
      recipientUserId: doc.recipientUserId.toString(),
      amount: doc.amount,
      note: doc.note,
      period: doc.period,
      createdAt,
    };
  }

  async recordFunding(
    input: RecordFundingInput,
    actor: JwtUser,
  ): Promise<FundingTransferObject> {
    const recipient = await this.usersRepo.findById(input.recipientUserId);
    const allowedRoles = [UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN];
    if (!recipient || !allowedRoles.includes(recipient.role)) {
      throw new BadRequestException(
        'Recipient must be a field user, admin, or super admin',
      );
    }

    if (input.period) {
      await this.monthlyPrincipalBudgetService.assertFundingFitsBudget(
        input.period,
        input.amount,
      );
    }

    await this.usersRepo.incrementWallet(input.recipientUserId, input.amount);

    const doc = await this.fundingRepo.create({
      adminUserId: new Types.ObjectId(actor.id),
      recipientUserId: new Types.ObjectId(input.recipientUserId),
      amount: input.amount,
      note: input.note,
      period: input.period,
    });

    return this.toObject(doc);
  }

  async listFunding(actor: JwtUser): Promise<FundingTransferObject[]> {
    if (actor.role === UserRole.USER) {
      const docs = await this.fundingRepo.findForRecipient(actor.id);
      return docs.map((d) => this.toObject(d));
    }
    const docs = await this.fundingRepo.findAll();
    return docs.map((d) => this.toObject(d));
  }

  async fundingUtilization(
    month: string,
    actor: JwtUser,
  ): Promise<FundingUtilizationPayload> {
    if (actor.role !== UserRole.ADMIN && actor.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException();
    }

    const { start, end } = parseMonth(month);
    const fieldUsers = await this.usersRepo.findByRole(UserRole.USER);

    const rows: FundingUtilizationRow[] = [];
    let totalFundingAssigned = 0;
    let totalPrincipalLoaned = 0;

    for (const u of fieldUsers) {
      const uid = u._id.toString();
      const fundingAssigned =
        await this.fundingRepo.sumAmountForRecipientInMonth(
          uid,
          month,
          start,
          end,
        );
      const loans = await this.loansRepo.findCreatedBetween(start, end, uid);
      const principalLoaned = loans.reduce((s, l) => s + l.principalAmount, 0);

      totalFundingAssigned += fundingAssigned;
      totalPrincipalLoaned += principalLoaned;

      rows.push({
        userId: uid,
        name: u.name,
        email: u.email,
        fundingAssigned,
        principalLoaned,
        walletBalance: u.walletBalance ?? 0,
      });
    }

    return {
      month,
      rows,
      totals: {
        fundingAssigned: totalFundingAssigned,
        principalLoaned: totalPrincipalLoaned,
      },
    };
  }
}
