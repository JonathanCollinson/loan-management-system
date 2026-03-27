import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { CapitalFund } from '../../capital-funds/schemas/capital-fund.schema';
import { User } from '../../users/schemas/user.schema';

export type UserFundAllocationDocument = HydratedDocument<UserFundAllocation>;

/** Lendable principal assigned to a user from a specific capital fund (via record funding). */
@Schema({ timestamps: true })
export class UserFundAllocation {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: CapitalFund.name, required: true })
  fundId: Types.ObjectId;

  @Prop({ required: true, default: 0 })
  balance: number;
}

export const UserFundAllocationSchema =
  SchemaFactory.createForClass(UserFundAllocation);

UserFundAllocationSchema.index({ userId: 1, fundId: 1 }, { unique: true });
UserFundAllocationSchema.index({ fundId: 1 });
