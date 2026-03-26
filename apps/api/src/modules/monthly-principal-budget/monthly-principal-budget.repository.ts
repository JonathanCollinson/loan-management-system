import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import {
  MonthlyPrincipalBudget,
  MonthlyPrincipalBudgetDocument,
} from './schemas/monthly-principal-budget.schema';
import {
  MonthlyPrincipalBudgetEvent,
  MonthlyPrincipalBudgetEventDocument,
} from './schemas/monthly-principal-budget-event.schema';

@Injectable()
export class MonthlyPrincipalBudgetRepository {
  constructor(
    @InjectModel(MonthlyPrincipalBudget.name)
    private readonly budgetModel: Model<MonthlyPrincipalBudgetDocument>,
    @InjectModel(MonthlyPrincipalBudgetEvent.name)
    private readonly eventModel: Model<MonthlyPrincipalBudgetEventDocument>,
  ) {}

  async findByMonth(
    month: string,
    session?: ClientSession,
  ): Promise<MonthlyPrincipalBudgetDocument | null> {
    const q = this.budgetModel.findOne({ month });
    if (session) q.session(session);
    return q.exec();
  }

  async upsertTotal(
    month: string,
    totalPrincipal: number,
    note: string | undefined,
    session?: ClientSession,
  ): Promise<MonthlyPrincipalBudgetDocument> {
    const q = this.budgetModel.findOneAndUpdate(
      { month },
      { $set: { totalPrincipal, ...(note !== undefined ? { note } : {}) } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    if (session) q.session(session);
    const doc = await q.exec();
    if (!doc) throw new Error('upsertTotal failed');
    return doc;
  }

  async appendEvent(
    data: {
      month: string;
      delta: number;
      previousTotal: number;
      newTotal: number;
      actorUserId: Types.ObjectId;
      note?: string;
    },
    session?: ClientSession,
  ): Promise<MonthlyPrincipalBudgetEventDocument> {
    const [doc] = await this.eventModel.create(
      [data],
      session ? { session } : {},
    );
    return doc;
  }

  async listEventsForMonth(
    month: string,
  ): Promise<MonthlyPrincipalBudgetEventDocument[]> {
    return this.eventModel
      .find({ month })
      .sort({ createdAt: 1 })
      .exec();
  }
}
