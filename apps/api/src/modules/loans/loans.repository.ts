import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { Loan, LoanDocument } from './schemas/loan.schema';

@Injectable()
export class LoansRepository {
  constructor(
    @InjectModel(Loan.name) private readonly loanModel: Model<LoanDocument>,
  ) {}

  async create(
    data: Partial<Loan>,
    session?: ClientSession,
  ): Promise<LoanDocument> {
    const [doc] = await this.loanModel.create(
      [data],
      session ? { session } : {},
    );
    return doc;
  }

  async findById(
    id: string,
    session?: ClientSession,
  ): Promise<LoanDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const q = this.loanModel.findById(id);
    if (session) q.session(session);
    return q.exec();
  }

  async findByOwner(ownerUserId: string): Promise<LoanDocument[]> {
    if (!Types.ObjectId.isValid(ownerUserId)) return [];
    return this.loanModel
      .find({ ownerUserId: new Types.ObjectId(ownerUserId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findAll(): Promise<LoanDocument[]> {
    return this.loanModel.find().sort({ createdAt: -1 }).exec();
  }

  async findCreatedBetween(
    start: Date,
    end: Date,
    ownerUserId?: string,
  ): Promise<LoanDocument[]> {
    const q: Record<string, unknown> = {
      createdAt: { $gte: start, $lte: end },
    };
    if (ownerUserId) {
      q.ownerUserId = new Types.ObjectId(ownerUserId);
    }
    return this.loanModel.find(q).exec();
  }

  async updateById(
    id: string,
    data: Partial<Loan>,
    session?: ClientSession,
  ): Promise<LoanDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const q = this.loanModel.findByIdAndUpdate(id, data, { new: true });
    if (session) q.session(session);
    return q.exec();
  }

  async sumPrincipalOutstandingForOwner(
    ownerUserId: string,
  ): Promise<number> {
    if (!Types.ObjectId.isValid(ownerUserId)) return 0;
    const agg = await this.loanModel
      .aggregate<{ total: number }>([
        {
          $match: {
            ownerUserId: new Types.ObjectId(ownerUserId),
            status: { $in: ['ACTIVE', 'OVERDUE'] },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$principalAmount' },
          },
        },
      ])
      .exec();
    return agg[0]?.total ?? 0;
  }

  async sumPrincipalCreatedBetween(start: Date, end: Date): Promise<number> {
    const agg = await this.loanModel
      .aggregate<{ total: number }>([
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
          },
        },
        { $group: { _id: null, total: { $sum: '$principalAmount' } } },
      ])
      .exec();
    return agg[0]?.total ?? 0;
  }
}
