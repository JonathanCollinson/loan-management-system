import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class MonthlyPrincipalBudget {
  /** YYYY-MM, unique */
  @Prop({ required: true, unique: true, index: true })
  month: string;

  @Prop({ required: true, min: 0 })
  totalPrincipal: number;

  @Prop({ trim: true })
  note?: string;
}

export type MonthlyPrincipalBudgetDocument =
  HydratedDocument<MonthlyPrincipalBudget>;

export const MonthlyPrincipalBudgetSchema = SchemaFactory.createForClass(
  MonthlyPrincipalBudget,
);
