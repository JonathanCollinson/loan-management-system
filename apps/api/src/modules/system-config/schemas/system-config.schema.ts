import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SystemConfigDocument = HydratedDocument<SystemConfig>;

@Schema({ collection: 'systemconfigs' })
export class SystemConfig {
  @Prop({ unique: true, default: 'global' })
  singletonKey: string;

  /** Flat interest rate (percent) used when a loan omits interestRate. */
  @Prop({ default: 10 })
  defaultInterestRate: number;

  /** Default loan term (months) when fund and input omit term. */
  @Prop({ default: 1 })
  defaultTermMonths: number;

  /** When a fund has no `rolloverMode`, this applies (AUTO vs manual approval). */
  @Prop({ type: String, enum: ['AUTO', 'MANUAL'], default: 'MANUAL' })
  globalRolloverMode: 'AUTO' | 'MANUAL';
}

export const SystemConfigSchema = SchemaFactory.createForClass(SystemConfig);
