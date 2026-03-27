import { Injectable } from '@nestjs/common';
import { GlobalRolloverMode } from '../../common/enums/global-rollover-mode.enum';
import { SystemConfigObject } from './graphql/system-config.object';
import { SystemConfigRepository } from './system-config.repository';

@Injectable()
export class SystemConfigService {
  constructor(private readonly repo: SystemConfigRepository) {}

  async get(): Promise<SystemConfigObject> {
    const doc = await this.repo.getOrCreate();
    return this.toObject(doc);
  }

  async getDefaultInterestRate(): Promise<number> {
    const doc = await this.repo.getOrCreate();
    return doc.defaultInterestRate;
  }

  async getDefaultTermMonths(): Promise<number> {
    const doc = await this.repo.getOrCreate();
    return doc.defaultTermMonths ?? 1;
  }

  async getGlobalRolloverMode(): Promise<'AUTO' | 'MANUAL'> {
    const doc = await this.repo.getOrCreate();
    return doc.globalRolloverMode ?? 'MANUAL';
  }

  async updateDefaultInterestRate(rate: number): Promise<SystemConfigObject> {
    const doc = await this.repo.setDefaultInterestRate(rate);
    return this.toObject(doc);
  }

  async updatePatch(patch: {
    defaultInterestRate?: number;
    defaultTermMonths?: number;
    globalRolloverMode?: 'AUTO' | 'MANUAL';
  }): Promise<SystemConfigObject> {
    const doc = await this.repo.updatePatch(patch);
    return this.toObject(doc);
  }

  private toObject(doc: {
    defaultInterestRate: number;
    defaultTermMonths?: number;
    globalRolloverMode?: 'AUTO' | 'MANUAL';
  }): SystemConfigObject {
    const mode = doc.globalRolloverMode ?? 'MANUAL';
    return {
      defaultInterestRate: doc.defaultInterestRate,
      defaultTermMonths: doc.defaultTermMonths ?? 1,
      globalRolloverMode:
        mode === 'AUTO' ? GlobalRolloverMode.AUTO : GlobalRolloverMode.MANUAL,
    };
  }
}
