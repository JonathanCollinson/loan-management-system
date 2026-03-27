import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { FundLedgerType } from '../../../common/enums/fund-ledger-type.enum';
import { CapitalFund } from './capital-fund.schema';
import { User } from '../../users/schemas/user.schema';

export type FundLedgerEntryDocument = HydratedDocument<FundLedgerEntry>;

@Schema({ timestamps: true })
export class FundLedgerEntry {
  @Prop({ type: Types.ObjectId, ref: CapitalFund.name, required: true })
  fundId: Types.ObjectId;

  @Prop({ required: true, type: String, enum: FundLedgerType })
  type: FundLedgerType;

  /** Positive = credit to fund balance; negative = debit (stored as positive amount with type). */
  @Prop({ required: true })
  amount: number;

  @Prop({ type: Types.ObjectId, ref: 'Loan' })
  loanId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name })
  actorUserId?: Types.ObjectId;

  @Prop()
  note?: string;
}

export const FundLedgerEntrySchema =
  SchemaFactory.createForClass(FundLedgerEntry);

FundLedgerEntrySchema.index({ fundId: 1, createdAt: -1 });
FundLedgerEntrySchema.index({ loanId: 1 });
