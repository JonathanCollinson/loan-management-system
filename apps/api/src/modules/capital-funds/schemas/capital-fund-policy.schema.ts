import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

/** Embedded policy: per-investor defaults and rules (scalable to many funds). */
@Schema({ _id: false })
export class CapitalFundPolicy {
  /** When set, new loans default to this rate unless overridden (super admin). */
  @Prop({ type: Number })
  defaultFlatInterestRatePercent?: number;

  @Prop({ type: Number })
  defaultTermMonths?: number;

  @Prop({ type: Number })
  minPrincipal?: number;

  @Prop({ type: Number })
  maxPrincipal?: number;

  @Prop({ type: String, enum: ['AUTO', 'MANUAL'] })
  rolloverMode?: 'AUTO' | 'MANUAL';

  /** Default % of current outstanding to add on rollover (interest-on-outstanding). */
  @Prop({ type: Number })
  rolloverInterestOnOutstandingPercent?: number;
}

export const CapitalFundPolicySchema =
  SchemaFactory.createForClass(CapitalFundPolicy);
