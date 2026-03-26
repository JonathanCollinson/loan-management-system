import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtUser } from '../../common/types/jwt-user';
import { UserRole } from '../../common/enums/user-role.enum';
import { UpdateSystemConfigInput } from './dto/update-system-config.input';
import { SystemConfigObject } from './graphql/system-config.object';
import { SystemConfigService } from './system-config.service';

@Resolver(() => SystemConfigObject)
export class SystemConfigResolver {
  constructor(private readonly systemConfigService: SystemConfigService) {}

  @Query(() => SystemConfigObject)
  async systemConfig(): Promise<SystemConfigObject> {
    return this.systemConfigService.get();
  }

  @Mutation(() => SystemConfigObject)
  @Roles(UserRole.SUPER_ADMIN)
  async updateSystemConfig(
    @Args('input') input: UpdateSystemConfigInput,
    @CurrentUser() _actor: JwtUser,
  ): Promise<SystemConfigObject> {
    return this.systemConfigService.updateDefaultInterestRate(
      input.defaultInterestRate,
    );
  }
}
