import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UserRole } from '../../common/enums/user-role.enum';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtUser } from '../../common/types/jwt-user';
import { CapitalFundsService } from './capital-funds.service';
import type { CapitalFundPolicy } from './schemas/capital-fund-policy.schema';
import { CreateCapitalFundInput } from './dto/create-capital-fund.input';
import { DepositToCapitalFundInput } from './dto/deposit-to-capital-fund.input';
import { UpdateCapitalFundInput } from './dto/update-capital-fund.input';
import { CapitalFundObject } from './graphql/capital-fund.object';

@Resolver(() => CapitalFundObject)
export class CapitalFundsResolver {
  constructor(private readonly capitalFundsService: CapitalFundsService) {}

  @Query(() => [CapitalFundObject])
  async capitalFunds(): Promise<CapitalFundObject[]> {
    return this.capitalFundsService.listFunds();
  }

  @Query(() => [CapitalFundObject])
  async activeCapitalFunds(): Promise<CapitalFundObject[]> {
    return this.capitalFundsService.listActiveFunds();
  }

  @Query(() => [CapitalFundObject])
  async capitalFundsForFilter(
    @CurrentUser() actor: JwtUser,
  ): Promise<CapitalFundObject[]> {
    return this.capitalFundsService.getFundsForFilter(actor);
  }

  @Query(() => CapitalFundObject)
  async capitalFund(@Args('id') id: string): Promise<CapitalFundObject> {
    return this.capitalFundsService.getFund(id);
  }

  @Mutation(() => CapitalFundObject)
  @Roles(UserRole.SUPER_ADMIN)
  async createCapitalFund(
    @Args('input') input: CreateCapitalFundInput,
  ): Promise<CapitalFundObject> {
    return this.capitalFundsService.createFund(
      input.name,
      (input.policy ?? {}) as Partial<CapitalFundPolicy>,
    );
  }

  @Mutation(() => CapitalFundObject)
  @Roles(UserRole.SUPER_ADMIN)
  async updateCapitalFund(
    @Args('input') input: UpdateCapitalFundInput,
  ): Promise<CapitalFundObject> {
    return this.capitalFundsService.updateFund(input.fundId, {
      name: input.name,
      isActive: input.isActive,
      policy: input.policy as Partial<CapitalFundPolicy> | undefined,
    });
  }

  @Mutation(() => CapitalFundObject)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async depositToCapitalFund(
    @Args('input') input: DepositToCapitalFundInput,
    @CurrentUser() actor: JwtUser,
  ): Promise<CapitalFundObject> {
    return this.capitalFundsService.depositToFund(
      input.fundId,
      input.amount,
      actor,
      input.note,
    );
  }
}
