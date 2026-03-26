import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { UserRole } from '../../common/enums/user-role.enum';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async create(data: Partial<User>): Promise<UserDocument> {
    return this.userModel.create(data);
  }

  async findById(id: string): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.userModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async count(): Promise<number> {
    return this.userModel.countDocuments().exec();
  }

  async findAllUsers(): Promise<UserDocument[]> {
    return this.userModel.find().sort({ createdAt: -1 }).exec();
  }

  async findByRole(role: UserRole): Promise<UserDocument[]> {
    return this.userModel.find({ role }).sort({ createdAt: -1 }).exec();
  }

  async updateById(
    id: string,
    data: Partial<User>,
  ): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.userModel
      .findByIdAndUpdate(id, data, { returnDocument: 'after' })
      .exec();
  }

  async incrementWallet(
    userId: string,
    delta: number,
    session?: ClientSession,
  ): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(userId)) return null;
    const q = this.userModel.findByIdAndUpdate(
      userId,
      { $inc: { walletBalance: delta } },
      { returnDocument: 'after' },
    );
    if (session) {
      q.session(session);
    }
    return q.exec();
  }

  /**
   * Atomically subtracts amount if walletBalance >= amount.
   */
  async decrementWalletIfGte(
    userId: string,
    amount: number,
    session?: ClientSession,
  ): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(userId)) return null;
    const q = this.userModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(userId),
        walletBalance: { $gte: amount },
      },
      { $inc: { walletBalance: -amount } },
      { returnDocument: 'after' },
    );
    if (session) {
      q.session(session);
    }
    return q.exec();
  }
}
