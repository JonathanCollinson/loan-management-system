import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtUser } from '../../common/types/jwt-user';
import { UserRole } from '../../common/enums/user-role.enum';
import { IncreaseMonthlyPrincipalBudgetInput } from './dto/increase-monthly-principal-budget.input';
import { SetMonthlyPrincipalBudgetInput } from './dto/set-monthly-principal-budget.input';
import { MonthlyPrincipalBudgetDetail } from './graphql/monthly-principal-budget-event.object';
import { MonthlyPrincipalBudgetService } from './monthly-principal-budget.service';

@Resolver()
export class MonthlyPrincipalBudgetResolver {
  constructor(
    private readonly monthlyPrincipalBudgetService: MonthlyPrincipalBudgetService,
  ) {}

  @Query(() => MonthlyPrincipalBudgetDetail)
  @Roles(UserRole.SUPER_ADMIN)
  async monthlyPrincipalBudget(
    @Args('month') month: string,
    @CurrentUser() _actor: JwtUser,
  ): Promise<MonthlyPrincipalBudgetDetail> {
    return this.monthlyPrincipalBudgetService.getDetail(month);
  }

  @Mutation(() => MonthlyPrincipalBudgetDetail)
  @Roles(UserRole.SUPER_ADMIN)
  async setMonthlyPrincipalBudget(
    @Args('input') input: SetMonthlyPrincipalBudgetInput,
    @CurrentUser() actor: JwtUser,
  ): Promise<MonthlyPrincipalBudgetDetail> {
    return this.monthlyPrincipalBudgetService.setMonthlyPrincipalBudget(
      input.month,
      input.totalPrincipal,
      input.note,
      actor,
    );
  }

  @Mutation(() => MonthlyPrincipalBudgetDetail)
  @Roles(UserRole.SUPER_ADMIN)
  async increaseMonthlyPrincipalBudget(
    @Args('input') input: IncreaseMonthlyPrincipalBudgetInput,
    @CurrentUser() actor: JwtUser,
  ): Promise<MonthlyPrincipalBudgetDetail> {
    return this.monthlyPrincipalBudgetService.increaseMonthlyPrincipalBudget(
      input.month,
      input.delta,
      input.note,
      actor,
    );
  }
}
