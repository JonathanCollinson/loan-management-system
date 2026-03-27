import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { InterestType } from '../../../common/enums/interest-type.enum';
import { LoanStatus } from '../../../common/enums/loan-status.enum';
import { Borrower } from '../../borrowers/schemas/borrower.schema';
import { CapitalFund } from '../../capital-funds/schemas/capital-fund.schema';
import { User } from '../../users/schemas/user.schema';

export type LoanDocument = HydratedDocument<Loan>;

@Schema({ timestamps: true })
export class Loan {
  @Prop({ type: Types.ObjectId, ref: Borrower.name, required: true })
  borrowerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  ownerUserId: Types.ObjectId;

  /** Pool this loan drew principal from (required for new loans; backfilled for legacy). */
  @Prop({ type: Types.ObjectId, ref: CapitalFund.name })
  principalFundId?: Types.ObjectId;

  @Prop({ required: true })
  principalAmount: number;

  @Prop({ required: true })
  interestRate: number;

  @Prop({ required: true, type: String, enum: InterestType })
  interestType: InterestType;

  @Prop({ required: true })
  interestAmount: number;

  @Prop({ required: true })
  totalAmount: number;

  @Prop({ required: true })
  termMonths: number;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ required: true })
  monthlyInstallment: number;

  @Prop({ required: true, type: String, enum: LoanStatus })
  status: LoanStatus;

  @Prop({ default: 0 })
  totalPaid: number;

  @Prop({ required: true })
  outstandingAmount: number;

  /** Set when the loan first reaches PAID (full repayment). */
  @Prop({ type: Date })
  paidAt?: Date;

  /** Rollover / period tracking (Phase 3). */
  @Prop({ type: Number, default: 0 })
  rolloverCount: number;

  @Prop({ type: Date })
  currentPeriodEnd?: Date;
}

export const LoanSchema = SchemaFactory.createForClass(Loan);

LoanSchema.index({ borrowerId: 1 });
LoanSchema.index({ ownerUserId: 1 });
LoanSchema.index({ principalFundId: 1 });
LoanSchema.index({ status: 1 });
