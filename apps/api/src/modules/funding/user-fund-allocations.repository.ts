import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import {
  UserFundAllocation,
  UserFundAllocationDocument,
} from './schemas/user-fund-allocation.schema';

@Injectable()
export class UserFundAllocationsRepository {
  constructor(
    @InjectModel(UserFundAllocation.name)
    private readonly model: Model<UserFundAllocationDocument>,
  ) {}

  async incrementBalance(
    userId: string,
    fundId: string,
    amount: number,
    session?: ClientSession,
  ): Promise<void> {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(fundId)) {
      return;
    }
    const uid = new Types.ObjectId(userId);
    const fid = new Types.ObjectId(fundId);
    await this.model.updateOne(
      { userId: uid, fundId: fid },
      {
        $inc: { balance: amount },
        $setOnInsert: { userId: uid, fundId: fid },
      },
      { upsert: true, session },
    );
  }

  /**
   * Atomically subtracts if balance >= amount. Returns false if insufficient or missing row.
   */
  async decrementBalanceIfGte(
    userId: string,
    fundId: string,
    amount: number,
    session?: ClientSession,
  ): Promise<boolean> {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(fundId)) {
      return false;
    }
    const uid = new Types.ObjectId(userId);
    const fid = new Types.ObjectId(fundId);
    const res = await this.model
      .findOneAndUpdate(
        {
          userId: uid,
          fundId: fid,
          balance: { $gte: amount },
        },
        { $inc: { balance: -amount } },
        { new: true, session },
      )
      .exec();
    return res != null;
  }

  async getBalance(userId: string, fundId: string): Promise<number> {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(fundId)) {
      return 0;
    }
    const doc = await this.model
      .findOne({
        userId: new Types.ObjectId(userId),
        fundId: new Types.ObjectId(fundId),
      })
      .exec();
    return doc?.balance ?? 0;
  }

  async findDistinctFundIdsByUserId(userId: string): Promise<string[]> {
    if (!Types.ObjectId.isValid(userId)) return [];
    const rows = await this.model
      .find({ userId: new Types.ObjectId(userId) })
      .select('fundId')
      .lean()
      .exec();
    const seen = new Set<string>();
    for (const r of rows) {
      seen.add((r as { fundId: Types.ObjectId }).fundId.toString());
    }
    return [...seen];
  }

  async sumBalanceByFund(fundId: string): Promise<number> {
    if (!Types.ObjectId.isValid(fundId)) return 0;
    const agg = await this.model
      .aggregate<{
        total: number;
      }>([
        { $match: { fundId: new Types.ObjectId(fundId) } },
        { $group: { _id: null, total: { $sum: '$balance' } } },
      ])
      .exec();
    return agg[0]?.total ?? 0;
  }
}
