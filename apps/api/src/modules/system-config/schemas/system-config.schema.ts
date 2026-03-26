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
}

export const SystemConfigSchema = SchemaFactory.createForClass(SystemConfig);
