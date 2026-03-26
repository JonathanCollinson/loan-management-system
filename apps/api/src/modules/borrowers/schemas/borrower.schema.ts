import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type BorrowerDocument = HydratedDocument<Borrower>;

@Schema({ timestamps: true })
export class Borrower {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ trim: true, default: '' })
  address: string;

  /** @deprecated Legacy; not exposed on GraphQL */
  @Prop({ trim: true, lowercase: true })
  email?: string;

  /** @deprecated Legacy; not exposed on GraphQL */
  @Prop({ trim: true })
  idDocument?: string;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  createdByUserId: Types.ObjectId;
}

export const BorrowerSchema = SchemaFactory.createForClass(Borrower);

BorrowerSchema.index({ createdByUserId: 1 });
