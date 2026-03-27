import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
  CapitalFundPolicy,
  CapitalFundPolicySchema,
} from './capital-fund-policy.schema';

export type CapitalFundDocument = HydratedDocument<CapitalFund>;

@Schema({ timestamps: true })
export class CapitalFund {
  @Prop({ required: true, trim: true })
  name: string;

  /** Current lendable balance (updated with ledger entries). */
  @Prop({ required: true, default: 0 })
  balance: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: CapitalFundPolicySchema, default: {} })
  policy: CapitalFundPolicy;
}

export const CapitalFundSchema = SchemaFactory.createForClass(CapitalFund);

CapitalFundSchema.index({ name: 1 });
CapitalFundSchema.index({ isActive: 1 });
