import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type FundingTransferDocument = HydratedDocument<FundingTransfer>;

@Schema({ timestamps: true })
export class FundingTransfer {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  adminUserId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  recipientUserId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop()
  note?: string;

  /** Optional YYYY-MM for monthly funding reporting (legacy rows use createdAt in month). */
  @Prop()
  period?: string;
}

export const FundingTransferSchema =
  SchemaFactory.createForClass(FundingTransfer);

FundingTransferSchema.index({ recipientUserId: 1, createdAt: -1 });
