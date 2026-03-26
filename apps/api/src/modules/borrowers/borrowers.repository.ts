import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Borrower, BorrowerDocument } from './schemas/borrower.schema';

@Injectable()
export class BorrowersRepository {
  constructor(
    @InjectModel(Borrower.name)
    private readonly borrowerModel: Model<BorrowerDocument>,
  ) {}

  async create(data: Partial<Borrower>): Promise<BorrowerDocument> {
    return this.borrowerModel.create(data);
  }

  async findById(id: string): Promise<BorrowerDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.borrowerModel.findById(id).exec();
  }

  async findByOwner(ownerUserId: string): Promise<BorrowerDocument[]> {
    if (!Types.ObjectId.isValid(ownerUserId)) return [];
    return this.borrowerModel
      .find({ createdByUserId: new Types.ObjectId(ownerUserId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findAll(): Promise<BorrowerDocument[]> {
    return this.borrowerModel.find().sort({ createdAt: -1 }).exec();
  }

  async updateById(
    id: string,
    data: Partial<Borrower>,
  ): Promise<BorrowerDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.borrowerModel
      .findByIdAndUpdate(id, data, { new: true })
      .exec();
  }
}
