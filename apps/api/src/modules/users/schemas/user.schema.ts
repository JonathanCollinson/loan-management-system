import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { UserRole } from '../../../common/enums/user-role.enum';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true, type: String, enum: UserRole })
  role: UserRole;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Number, default: 0 })
  walletBalance: number;

  @Prop({ type: Types.ObjectId, ref: User.name })
  createdByUserId?: Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);
