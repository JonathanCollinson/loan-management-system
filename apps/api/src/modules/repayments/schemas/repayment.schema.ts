import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { PaymentMethod } from '../../../common/enums/payment-method.enum';
import { Loan } from '../../loans/schemas/loan.schema';
import { User } from '../../users/schemas/user.schema';

export type RepaymentDocument = HydratedDocument<Repayment>;

@Schema({ timestamps: true })
export class Repayment {
  @Prop({ type: Types.ObjectId, ref: Loan.name, required: true })
  loanId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  paymentDate: Date;

  @Prop({ required: true, type: String, enum: PaymentMethod })
  method: PaymentMethod;

  @Prop({ type: Types.ObjectId, ref: User.name })
  recordedByUserId?: Types.ObjectId;
}

export const RepaymentSchema = SchemaFactory.createForClass(Repayment);

RepaymentSchema.index({ loanId: 1, paymentDate: -1 });
