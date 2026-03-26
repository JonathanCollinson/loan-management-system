import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtUser } from '../../common/types/jwt-user';
import { BorrowersService } from './borrowers.service';
import { CreateBorrowerInput } from './dto/create-borrower.input';
import { UpdateBorrowerInput } from './dto/update-borrower.input';
import { BorrowerObject } from './graphql/borrower.object';
import { BorrowerLoanSummaryPayload } from './graphql/borrower-loan-summary.object';

@Resolver(() => BorrowerObject)
export class BorrowersResolver {
  constructor(private readonly borrowersService: BorrowersService) {}

  @Query(() => [BorrowerObject])
  async borrowers(@CurrentUser() actor: JwtUser): Promise<BorrowerObject[]> {
    return this.borrowersService.listBorrowers(actor);
  }

  @Query(() => BorrowerLoanSummaryPayload)
  async borrowerLoanSummary(
    @CurrentUser() actor: JwtUser,
    @Args('month', { nullable: true }) month?: string,
  ): Promise<BorrowerLoanSummaryPayload> {
    return this.borrowersService.getBorrowerLoanSummary(actor, month);
  }

  @Query(() => BorrowerObject)
  async borrower(
    @Args('id') id: string,
    @CurrentUser() actor: JwtUser,
  ): Promise<BorrowerObject> {
    return this.borrowersService.getBorrower(id, actor);
  }

  @Mutation(() => BorrowerObject)
  async createBorrower(
    @Args('input') input: CreateBorrowerInput,
    @CurrentUser() actor: JwtUser,
  ): Promise<BorrowerObject> {
    return this.borrowersService.createBorrower(input, actor);
  }

  @Mutation(() => BorrowerObject)
  async updateBorrower(
    @Args('input') input: UpdateBorrowerInput,
    @CurrentUser() actor: JwtUser,
  ): Promise<BorrowerObject> {
    return this.borrowersService.updateBorrower(input, actor);
  }
}
