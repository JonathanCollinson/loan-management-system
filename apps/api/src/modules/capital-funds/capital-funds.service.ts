import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClientSession, Types } from 'mongoose';
import { FundLedgerType } from '../../common/enums/fund-ledger-type.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import type { JwtUser } from '../../common/types/jwt-user';
import { FundingRepository } from '../funding/funding.repository';
import { UserFundAllocationsRepository } from '../funding/user-fund-allocations.repository';
import { CapitalFundsRepository } from './capital-funds.repository';
import { CapitalFundDocument } from './schemas/capital-fund.schema';
import { CapitalFundPolicy } from './schemas/capital-fund-policy.schema';

const LEGACY_FUND_NAME = 'Legacy';

@Injectable()
export class CapitalFundsService {
  constructor(
    private readonly repo: CapitalFundsRepository,
    private readonly fundingRepo: FundingRepository,
    private readonly userFundAllocRepo: UserFundAllocationsRepository,
  ) {}

  /** Idempotent: create Legacy pool if no funds exist (first deploy). */
  async ensureLegacyFundExists(): Promise<string> {
    const existing = await this.repo.findByName(LEGACY_FUND_NAME);
    if (existing) return existing._id.toString();
    const created = await this.repo.create({
      name: LEGACY_FUND_NAME,
      balance: 0,
      isActive: true,
      policy: {},
    });
    return created._id.toString();
  }

  toObject(doc: CapitalFundDocument) {
    const d = doc as CapitalFundDocument & {
      createdAt?: Date;
      updatedAt?: Date;
    };
    return {
      id: doc._id.toString(),
      name: doc.name,
      balance: doc.balance,
      isActive: doc.isActive,
      policy: this.policyToObject(doc.policy),
      createdAt: d.createdAt ?? new Date(),
      updatedAt: d.updatedAt ?? new Date(),
    };
  }

  policyToObject(p: CapitalFundPolicy | undefined) {
    if (!p) return {};
    return {
      defaultFlatInterestRatePercent: p.defaultFlatInterestRatePercent,
      defaultTermMonths: p.defaultTermMonths,
      minPrincipal: p.minPrincipal,
      maxPrincipal: p.maxPrincipal,
      rolloverMode: p.rolloverMode,
      rolloverInterestOnOutstandingPercent:
        p.rolloverInterestOnOutstandingPercent,
    };
  }

  async listFunds(): Promise<ReturnType<CapitalFundsService['toObject']>[]> {
    const docs = await this.repo.findAll();
    return docs.map((d) => this.toObject(d));
  }

  async listActiveFunds(): Promise<
    ReturnType<CapitalFundsService['toObject']>[]
  > {
    const docs = await this.repo.findAllActive();
    return docs.map((d) => this.toObject(d));
  }

  /**
   * Funds the actor may use in summary/loans filters: all active for admins;
   * field users only funds that assigned them money (transfers + allocation rows).
   */
  async getFundsForFilter(
    actor: JwtUser,
  ): Promise<ReturnType<CapitalFundsService['toObject']>[]> {
    if (actor.role !== UserRole.USER) {
      return this.listActiveFunds();
    }
    const fromTransfers =
      await this.fundingRepo.distinctCapitalFundIdsForRecipient(actor.id);
    const fromAlloc = await this.userFundAllocRepo.findDistinctFundIdsByUserId(
      actor.id,
    );
    const union = new Set<string>([...fromTransfers, ...fromAlloc]);
    if (union.size === 0) return [];
    const docs = await this.repo.findActiveByIds([...union]);
    return docs.map((d) => this.toObject(d));
  }

  /**
   * Field users may only filter by funds returned from getFundsForFilter.
   */
  async assertCanUsePrincipalFundForFilter(
    actor: JwtUser,
    principalFundId: string | null | undefined,
  ): Promise<void> {
    if (principalFundId == null || principalFundId === '') return;
    if (!Types.ObjectId.isValid(principalFundId)) {
      throw new BadRequestException('Invalid capital fund id');
    }
    if (actor.role !== UserRole.USER) return;
    const allowed = await this.getFundsForFilter(actor);
    const ok = allowed.some((f) => f.id === principalFundId);
    if (!ok) {
      throw new ForbiddenException(
        'You are not allowed to filter by this capital fund',
      );
    }
  }

  async getFund(
    id: string,
  ): Promise<ReturnType<CapitalFundsService['toObject']>> {
    const doc = await this.repo.findById(id);
    if (!doc) throw new NotFoundException('Capital fund not found');
    return this.toObject(doc);
  }

  async createFund(
    name: string,
    policy: Partial<CapitalFundPolicy>,
  ): Promise<ReturnType<CapitalFundsService['toObject']>> {
    const dup = await this.repo.findByName(name.trim());
    if (dup) {
      throw new BadRequestException('A fund with this name already exists');
    }
    const doc = await this.repo.create({
      name: name.trim(),
      balance: 0,
      isActive: true,
      policy: { ...policy },
    });
    return this.toObject(doc);
  }

  async updateFund(
    id: string,
    patch: {
      name?: string;
      isActive?: boolean;
      policy?: Partial<CapitalFundPolicy>;
    },
  ): Promise<ReturnType<CapitalFundsService['toObject']>> {
    const doc = await this.repo.findById(id);
    if (!doc) throw new NotFoundException('Capital fund not found');
    if (patch.name && patch.name.trim() !== doc.name) {
      const dup = await this.repo.findByName(patch.name.trim());
      if (dup && dup._id.toString() !== id) {
        throw new BadRequestException('A fund with this name already exists');
      }
    }
    const updated = await this.repo.updateById(id, {
      ...(patch.name != null ? { name: patch.name.trim() } : {}),
      ...(patch.isActive != null ? { isActive: patch.isActive } : {}),
      ...(patch.policy != null
        ? { policy: { ...doc.policy, ...patch.policy } as CapitalFundPolicy }
        : {}),
    });
    if (!updated) throw new NotFoundException('Capital fund not found');
    return this.toObject(updated);
  }

  async depositToFund(
    fundId: string,
    amount: number,
    actor: JwtUser,
    note?: string,
    session?: ClientSession,
  ): Promise<ReturnType<CapitalFundsService['toObject']>> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }
    const fund = await this.repo.findById(fundId);
    if (!fund) throw new NotFoundException('Capital fund not found');
    const updated = await this.repo.adjustBalanceWithLedger(
      fundId,
      amount,
      {
        type: FundLedgerType.DEPOSIT,
        amount,
        actorUserId: actor.id,
        note,
      },
      session,
    );
    if (!updated) throw new NotFoundException('Capital fund not found');
    return this.toObject(updated);
  }

  /**
   * Debit fund for loan disbursement. Caller must enforce budget elsewhere.
   */
  async disburseForLoan(
    fundId: string,
    principal: number,
    loanId: string,
    actorUserId: string,
    session?: ClientSession,
  ): Promise<void> {
    const fund = await this.repo.findById(fundId);
    if (!fund || !fund.isActive) {
      throw new BadRequestException('Invalid or inactive capital fund');
    }
    if (fund.balance < principal) {
      throw new BadRequestException(
        'Insufficient balance in the selected capital fund',
      );
    }
    const updated = await this.repo.adjustBalanceWithLedger(
      fundId,
      -principal,
      {
        type: FundLedgerType.DISBURSEMENT,
        amount: principal,
        loanId,
        actorUserId,
        note: 'Loan disbursement',
      },
      session,
    );
    if (!updated) throw new BadRequestException('Could not disburse from fund');
  }

  async receiveRepayment(
    fundId: string,
    amount: number,
    loanId: string,
    actorUserId: string,
    session?: ClientSession,
  ): Promise<void> {
    await this.repo.adjustBalanceWithLedger(
      fundId,
      amount,
      {
        type: FundLedgerType.REPAYMENT_IN,
        amount,
        loanId,
        actorUserId,
        note: 'Loan repayment',
      },
      session,
    );
  }

  /**
   * Move principal from the pool to a field user's per-fund allocation (record funding).
   */
  async allocateFieldFunding(
    fundId: string,
    amount: number,
    recipientUserId: string,
    actorUserId: string,
    session?: ClientSession,
  ): Promise<void> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }
    const fund = await this.repo.findById(fundId);
    if (!fund || !fund.isActive) {
      throw new BadRequestException('Invalid or inactive capital fund');
    }
    if (fund.balance < amount) {
      throw new BadRequestException(
        'Insufficient balance in the selected capital fund',
      );
    }
    const updated = await this.repo.adjustBalanceWithLedger(
      fundId,
      -amount,
      {
        type: FundLedgerType.FIELD_ALLOCATION,
        amount,
        actorUserId,
        note: `Field allocation to user ${recipientUserId}`,
      },
      session,
    );
    if (!updated) {
      throw new BadRequestException('Could not allocate from capital fund');
    }
  }

  assertPrincipalWithinPolicy(
    fund: CapitalFundDocument,
    principal: number,
  ): void {
    const p = fund.policy;
    if (p?.minPrincipal != null && principal < p.minPrincipal) {
      throw new BadRequestException(
        `Principal must be at least ${p.minPrincipal} for this fund`,
      );
    }
    if (p?.maxPrincipal != null && principal > p.maxPrincipal) {
      throw new BadRequestException(
        `Principal must be at most ${p.maxPrincipal} for this fund`,
      );
    }
  }

  resolveDefaultInterestRatePercent(
    fund: CapitalFundDocument,
    systemDefault: number,
  ): number | undefined {
    return fund.policy?.defaultFlatInterestRatePercent ?? systemDefault;
  }

  resolveDefaultTermMonths(fund: CapitalFundDocument): number | undefined {
    return fund.policy?.defaultTermMonths;
  }

  canOverrideInterest(actor: JwtUser): boolean {
    return actor.role === UserRole.SUPER_ADMIN;
  }

  /** Fund policy wins; otherwise platform default from system config. */
  effectiveRolloverMode(
    fund: CapitalFundDocument | null,
    globalMode: 'AUTO' | 'MANUAL',
  ): 'AUTO' | 'MANUAL' {
    return fund?.policy?.rolloverMode ?? globalMode;
  }
}
