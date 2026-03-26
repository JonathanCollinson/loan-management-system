import { Injectable } from '@nestjs/common';
import { SystemConfigObject } from './graphql/system-config.object';
import { SystemConfigRepository } from './system-config.repository';

@Injectable()
export class SystemConfigService {
  constructor(private readonly repo: SystemConfigRepository) {}

  async get(): Promise<SystemConfigObject> {
    const doc = await this.repo.getOrCreate();
    return { defaultInterestRate: doc.defaultInterestRate };
  }

  async getDefaultInterestRate(): Promise<number> {
    const doc = await this.repo.getOrCreate();
    return doc.defaultInterestRate;
  }

  async updateDefaultInterestRate(rate: number): Promise<SystemConfigObject> {
    const doc = await this.repo.setDefaultInterestRate(rate);
    return { defaultInterestRate: doc.defaultInterestRate };
  }
}
