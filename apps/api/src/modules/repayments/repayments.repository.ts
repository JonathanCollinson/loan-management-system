import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { Repayment, RepaymentDocument } from './schemas/repayment.schema';

@Injectable()
export class RepaymentsRepository {
  constructor(
    @InjectModel(Repayment.name)
    private readonly repaymentModel: Model<RepaymentDocument>,
  ) {}

  async create(
    data: Partial<Repayment>,
    session?: ClientSession,
  ): Promise<RepaymentDocument> {
    const [doc] = await this.repaymentModel.create(
      [data],
      session ? { session } : {},
    );
    return doc;
  }

  async findByLoan(loanId: string): Promise<RepaymentDocument[]> {
    if (!Types.ObjectId.isValid(loanId)) return [];
    return this.repaymentModel
      .find({ loanId: new Types.ObjectId(loanId) })
      .sort({ paymentDate: -1 })
      .exec();
  }

  async findByOwnerLoanIds(
    loanIds: Types.ObjectId[],
  ): Promise<RepaymentDocument[]> {
    if (!loanIds.length) return [];
    return this.repaymentModel
      .find({ loanId: { $in: loanIds } })
      .sort({ paymentDate: -1 })
      .exec();
  }

  async findAll(): Promise<RepaymentDocument[]> {
    return this.repaymentModel.find().sort({ paymentDate: -1 }).exec();
  }

  async findPaymentsBetween(
    start: Date,
    end: Date,
    loanIds?: Types.ObjectId[],
  ): Promise<RepaymentDocument[]> {
    const q: Record<string, unknown> = {
      paymentDate: { $gte: start, $lte: end },
    };
    if (loanIds?.length) {
      q.loanId = { $in: loanIds };
    }
    return this.repaymentModel.find(q).exec();
  }
}
