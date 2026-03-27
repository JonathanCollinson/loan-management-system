import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  SystemConfig,
  SystemConfigDocument,
} from './schemas/system-config.schema';

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
      defaultTermMonths: 1,
      globalRolloverMode: 'MANUAL',
    });
  }

  async setDefaultInterestRate(rate: number): Promise<SystemConfigDocument> {
    const doc = await this.model
      .findOneAndUpdate(
        { singletonKey: 'global' },
        {
          $set: { defaultInterestRate: rate },
          $setOnInsert: {
            singletonKey: 'global',
            defaultTermMonths: 1,
            globalRolloverMode: 'MANUAL',
          },
        },
        { returnDocument: 'after', upsert: true },
      )
      .exec();
    if (!doc) {
      return this.getOrCreate();
    }
    return doc;
  }

  async updatePatch(patch: {
    defaultInterestRate?: number;
    defaultTermMonths?: number;
    globalRolloverMode?: 'AUTO' | 'MANUAL';
  }): Promise<SystemConfigDocument> {
    const $set: Record<string, unknown> = {};
    if (patch.defaultInterestRate != null) {
      $set.defaultInterestRate = patch.defaultInterestRate;
    }
    if (patch.defaultTermMonths != null) {
      $set.defaultTermMonths = patch.defaultTermMonths;
    }
    if (patch.globalRolloverMode != null) {
      $set.globalRolloverMode = patch.globalRolloverMode;
    }
    const doc = await this.model
      .findOneAndUpdate(
        { singletonKey: 'global' },
        {
          $set,
          $setOnInsert: {
            singletonKey: 'global',
            defaultInterestRate: 10,
            defaultTermMonths: 1,
            globalRolloverMode: 'MANUAL',
          },
        },
        { returnDocument: 'after', upsert: true },
      )
      .exec();
    if (!doc) {
      return this.getOrCreate();
    }
    return doc;
  }
}
