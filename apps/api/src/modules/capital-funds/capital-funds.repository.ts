import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { FundLedgerType } from '../../common/enums/fund-ledger-type.enum';
import {
  CapitalFund,
  CapitalFundDocument,
} from './schemas/capital-fund.schema';
import {
  FundLedgerEntry,
  FundLedgerEntryDocument,
} from './schemas/fund-ledger-entry.schema';

@Injectable()
export class CapitalFundsRepository {
  constructor(
    @InjectModel(CapitalFund.name)
    private readonly fundModel: Model<CapitalFundDocument>,
    @InjectModel(FundLedgerEntry.name)
    private readonly ledgerModel: Model<FundLedgerEntryDocument>,
  ) {}

  async findById(id: string): Promise<CapitalFundDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.fundModel.findById(id).exec();
  }

  async findByName(name: string): Promise<CapitalFundDocument | null> {
    return this.fundModel.findOne({ name }).exec();
  }

  async findAllActive(): Promise<CapitalFundDocument[]> {
    return this.fundModel.find({ isActive: true }).sort({ name: 1 }).exec();
  }

  async findActiveByIds(ids: string[]): Promise<CapitalFundDocument[]> {
    const oids = ids
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    if (oids.length === 0) return [];
    return this.fundModel
      .find({ _id: { $in: oids }, isActive: true })
      .sort({ name: 1 })
      .exec();
  }

  async findAll(): Promise<CapitalFundDocument[]> {
    return this.fundModel.find().sort({ name: 1 }).exec();
  }

  async create(
    data: Partial<CapitalFund>,
    session?: ClientSession,
  ): Promise<CapitalFundDocument> {
    const [doc] = await this.fundModel.create(
      [data],
      session ? { session } : {},
    );
    return doc;
  }

  async updateById(
    id: string,
    patch: Partial<CapitalFund>,
    session?: ClientSession,
  ): Promise<CapitalFundDocument | null> {
    return this.fundModel
      .findByIdAndUpdate(id, patch, { new: true, session })
      .exec();
  }

  /**
   * Atomically adjust balance and append ledger row (use inside transaction).
   */
  async adjustBalanceWithLedger(
    fundId: string,
    delta: number,
    ledger: {
      type: FundLedgerType;
      amount: number;
      loanId?: string;
      actorUserId?: string;
      note?: string;
    },
    session?: ClientSession,
  ): Promise<CapitalFundDocument | null> {
    const updated = await this.fundModel
      .findByIdAndUpdate(
        fundId,
        { $inc: { balance: delta } },
        { new: true, session },
      )
      .exec();
    if (!updated) return null;
    await this.ledgerModel.create(
      [
        {
          fundId: new Types.ObjectId(fundId),
          type: ledger.type,
          amount: ledger.amount,
          loanId: ledger.loanId ? new Types.ObjectId(ledger.loanId) : undefined,
          actorUserId: ledger.actorUserId
            ? new Types.ObjectId(ledger.actorUserId)
            : undefined,
          note: ledger.note,
        },
      ],
      session ? { session } : {},
    );
    return updated;
  }
}
