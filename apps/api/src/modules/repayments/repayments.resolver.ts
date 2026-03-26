import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtUser } from '../../common/types/jwt-user';
import { AddRepaymentInput } from './dto/add-repayment.input';
import { RepaymentObject } from './graphql/repayment.object';
import { RepaymentsService } from './repayments.service';

@Resolver(() => RepaymentObject)
export class RepaymentsResolver {
  constructor(private readonly repaymentsService: RepaymentsService) {}

  @Query(() => [RepaymentObject])
  async repayments(@CurrentUser() actor: JwtUser): Promise<RepaymentObject[]> {
    return this.repaymentsService.listRepayments(actor);
  }

  @Query(() => [RepaymentObject])
  async repaymentsForLoan(
    @Args('loanId') loanId: string,
    @CurrentUser() actor: JwtUser,
  ): Promise<RepaymentObject[]> {
    return this.repaymentsService.listRepaymentsForLoan(loanId, actor);
  }

  @Mutation(() => RepaymentObject)
  async addRepayment(
    @Args('input') input: AddRepaymentInput,
    @CurrentUser() actor: JwtUser,
  ): Promise<RepaymentObject> {
    return this.repaymentsService.addRepayment(input, actor);
  }
}
