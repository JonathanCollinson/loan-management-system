import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SystemConfig, SystemConfigDocument } from './schemas/system-config.schema';

@Injectable()
export class SystemConfigRepository {
  constructor(
    @InjectModel(SystemConfig.name)
    private readonly model: Model<SystemConfigDocument>,
  ) {}

  async getOrCreate(): Promise<SystemConfigDocument> {
    const existing = await this.model
      .findOne({ singletonKey: 'global' })
      .exec();
    if (existing) return existing;
    return this.model.create({
      singletonKey: 'global',
      defaultInterestRate: 10,
    });
  }

  async setDefaultInterestRate(
    rate: number,
  ): Promise<SystemConfigDocument> {
    const doc = await this.model
      .findOneAndUpdate(
        { singletonKey: 'global' },
        {
          $set: { defaultInterestRate: rate },
          $setOnInsert: { singletonKey: 'global' },
        },
        { new: true, upsert: true },
      )
      .exec();
    if (!doc) {
      return this.getOrCreate();
    }
    return doc;
  }
}
