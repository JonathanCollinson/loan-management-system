import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { HydratedDocument } from 'mongoose';

/** Append-only audit of budget changes. */
@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class MonthlyPrincipalBudgetEvent {
  @Prop({ required: true, index: true })
  month: string;

  @Prop({ required: true })
  delta: number;

  @Prop({ required: true })
  previousTotal: number;

  @Prop({ required: true })
  newTotal: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  actorUserId: Types.ObjectId;

  @Prop({ trim: true })
  note?: string;
}

export type MonthlyPrincipalBudgetEventDocument =
  HydratedDocument<MonthlyPrincipalBudgetEvent>;

export const MonthlyPrincipalBudgetEventSchema = SchemaFactory.createForClass(
  MonthlyPrincipalBudgetEvent,
);
