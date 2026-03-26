import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
  ): Promise<FundingTransferDocument> {
    return this.model.create(data);
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
                    $or: [
                      { period: null },
                      { period: { $exists: false } },
                    ],
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
