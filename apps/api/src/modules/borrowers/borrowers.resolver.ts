import {
  Args,
  Mutation,
  Query,
  Resolver,
  registerEnumType,
} from '@nestjs/graphql';
import {
  createBorrowerInputSchema,
  updateBorrowerInputSchema,
} from '@lms/validation';
import { BorrowerAudience } from '../../common/enums/borrower-audience.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtUser } from '../../common/types/jwt-user';
import { ParseZodPipe } from '../../common/pipes/parse-zod.pipe';
import { BorrowersService } from './borrowers.service';
import { CreateBorrowerInput } from './dto/create-borrower.input';
import { UpdateBorrowerInput } from './dto/update-borrower.input';
import { BorrowerObject } from './graphql/borrower.object';
import { BorrowerLoanSummaryPayload } from './graphql/borrower-loan-summary.object';

registerEnumType(BorrowerAudience, { name: 'BorrowerAudience' });

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
    @Args('principalFundId', { nullable: true }) principalFundId?: string,
    @Args('borrowerIds', { type: () => [String], nullable: true })
    borrowerIds?: string[],
    @Args('createdFrom', { nullable: true }) createdFrom?: string,
    @Args('createdTo', { nullable: true }) createdTo?: string,
  ): Promise<BorrowerLoanSummaryPayload> {
    return this.borrowersService.getBorrowerLoanSummary(actor, {
      month,
      principalFundId,
      borrowerIds,
      createdFrom,
      createdTo,
    });
  }

  @Query(() => String)
  async borrowerLoanSummaryCsv(
    @CurrentUser() actor: JwtUser,
    @Args('month', { nullable: true }) month?: string,
    @Args('principalFundId', { nullable: true }) principalFundId?: string,
    @Args('borrowerIds', { type: () => [String], nullable: true })
    borrowerIds?: string[],
    @Args('createdFrom', { nullable: true }) createdFrom?: string,
    @Args('createdTo', { nullable: true }) createdTo?: string,
    @Args('allFunds', { nullable: true }) allFunds?: boolean,
  ): Promise<string> {
    return this.borrowersService.buildBorrowerLoanSummaryCsv(actor, {
      month,
      principalFundId,
      borrowerIds,
      createdFrom,
      createdTo,
      allFunds,
    });
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
    @Args('input', new ParseZodPipe(createBorrowerInputSchema))
    input: CreateBorrowerInput,
    @CurrentUser() actor: JwtUser,
  ): Promise<BorrowerObject> {
    return this.borrowersService.createBorrower(input, actor);
  }

  @Mutation(() => BorrowerObject)
  async updateBorrower(
    @Args('input', new ParseZodPipe(updateBorrowerInputSchema))
    input: UpdateBorrowerInput,
    @CurrentUser() actor: JwtUser,
  ): Promise<BorrowerObject> {
    return this.borrowersService.updateBorrower(input, actor);
  }
}
