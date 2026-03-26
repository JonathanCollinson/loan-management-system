import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SystemConfig,
  SystemConfigSchema,
} from './schemas/system-config.schema';
import { SystemConfigRepository } from './system-config.repository';
import { SystemConfigResolver } from './system-config.resolver';
import { SystemConfigService } from './system-config.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SystemConfig.name, schema: SystemConfigSchema },
    ]),
  ],
  providers: [
    SystemConfigRepository,
    SystemConfigService,
    SystemConfigResolver,
  ],
  exports: [SystemConfigService],
})
export class SystemConfigModule {}
