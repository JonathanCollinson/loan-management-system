import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtUser } from '../../common/types/jwt-user';
import { UserRole } from '../../common/enums/user-role.enum';
import { RecordFundingInput } from './dto/record-funding.input';
import { FundingTransferObject } from './graphql/funding-transfer.object';
import { FundingUtilizationPayload } from './graphql/funding-utilization.object';
import { FundingService } from './funding.service';

@Resolver(() => FundingTransferObject)
export class FundingResolver {
  constructor(private readonly fundingService: FundingService) {}

  @Query(() => [FundingTransferObject])
  async fundingTransfers(
    @CurrentUser() actor: JwtUser,
  ): Promise<FundingTransferObject[]> {
    return this.fundingService.listFunding(actor);
  }

  @Query(() => FundingUtilizationPayload)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async fundingUtilization(
    @Args('month') month: string,
    @CurrentUser() actor: JwtUser,
  ): Promise<FundingUtilizationPayload> {
    return this.fundingService.fundingUtilization(month, actor);
  }

  @Mutation(() => FundingTransferObject)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async recordFunding(
    @Args('input') input: RecordFundingInput,
    @CurrentUser() actor: JwtUser,
  ): Promise<FundingTransferObject> {
    return this.fundingService.recordFunding(input, actor);
  }
}
