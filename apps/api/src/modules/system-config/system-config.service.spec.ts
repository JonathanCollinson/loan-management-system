import { Test, TestingModule } from '@nestjs/testing';
import { SystemConfigService } from './system-config.service';
import { SystemConfigRepository } from './system-config.repository';

describe('SystemConfigService', () => {
  let service: SystemConfigService;
  const repo = {
    getOrCreate: jest.fn(),
    setDefaultInterestRate: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemConfigService,
        { provide: SystemConfigRepository, useValue: repo },
      ],
    }).compile();
    service = module.get(SystemConfigService);
  });

  it('get returns default rate from repo', async () => {
    repo.getOrCreate.mockResolvedValue({ defaultInterestRate: 12 });
    const out = await service.get();
    expect(out.defaultInterestRate).toBe(12);
  });

  it('updateDefaultInterestRate delegates to repo', async () => {
    repo.setDefaultInterestRate.mockResolvedValue({ defaultInterestRate: 15 });
    const out = await service.updateDefaultInterestRate(15);
    expect(out.defaultInterestRate).toBe(15);
  });
});
