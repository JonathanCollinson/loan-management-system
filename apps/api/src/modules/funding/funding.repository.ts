import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import {
  FundingTransfer,
  FundingTransferDocument,
} from './schemas/funding-transfer.schema';

@Injectable()
export class FundingRepository {
  constructor(
    @InjectModel(FundingTransfer.name)
    private readonly model: Model<FundingTransferDocument>,
  ) {}

  async create(
    data: Partial<FundingTransfer>,
    session?: ClientSession,
  ): Promise<FundingTransferDocument> {
    const [doc] = await this.model.create([data], session ? { session } : {});
    return doc;
  }

  async findAll(): Promise<FundingTransferDocument[]> {
    return this.model.find().sort({ createdAt: -1 }).exec();
  }

  async findForRecipient(
    recipientUserId: string,
  ): Promise<FundingTransferDocument[]> {
    if (!Types.ObjectId.isValid(recipientUserId)) return [];
    return this.model
      .find({ recipientUserId: new Types.ObjectId(recipientUserId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  /** Distinct capital fund ids from transfers that assigned money to this user. */
  async distinctCapitalFundIdsForRecipient(
    recipientUserId: string,
  ): Promise<string[]> {
    if (!Types.ObjectId.isValid(recipientUserId)) return [];
    const rid = new Types.ObjectId(recipientUserId);
    const rows = await this.model
      .aggregate<{ _id: Types.ObjectId }>([
        {
          $match: {
            recipientUserId: rid,
            capitalFundId: { $exists: true, $ne: null },
          },
        },
        { $group: { _id: '$capitalFundId' } },
      ])
      .exec();
    return rows.map((r) => r._id.toString());
  }

  /**
   * Sums funding for a recipient: transfers tagged with `period`, or legacy
   * rows without `period` whose createdAt falls in the month range.
   */
  async sumAmountForRecipientInMonth(
    recipientUserId: string,
    month: string,
    start: Date,
    end: Date,
  ): Promise<number> {
    if (!Types.ObjectId.isValid(recipientUserId)) return 0;
    const rid = new Types.ObjectId(recipientUserId);
    const agg = await this.model
      .aggregate<{ total: number }>([
        {
          $match: {
            recipientUserId: rid,
            $or: [
              { period: month },
              {
                $and: [
                  {
                    $or: [{ period: null }, { period: { $exists: false } }],
                  },
                  { createdAt: { $gte: start, $lte: end } },
                ],
              },
            ],
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ])
      .exec();
    return agg[0]?.total ?? 0;
  }

  /** All recipients: funding tagged with `period`, or legacy rows without `period` in the month range. */
  async sumTotalAllocationsInMonth(
    month: string,
    start: Date,
    end: Date,
  ): Promise<number> {
    const agg = await this.model
      .aggregate<{ total: number }>([
        {
          $match: {
            $or: [
              { period: month },
              {
                $and: [
                  {
                    $or: [{ period: null }, { period: { $exists: false } }],
                  },
                  { createdAt: { $gte: start, $lte: end } },
                ],
              },
            ],
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ])
      .exec();
    return agg[0]?.total ?? 0;
  }
}
