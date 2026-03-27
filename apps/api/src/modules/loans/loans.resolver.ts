import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { createLoanInputSchema } from '@lms/validation';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtUser } from '../../common/types/jwt-user';
import { ParseZodPipe } from '../../common/pipes/parse-zod.pipe';
import { CreateLoanInput } from './dto/create-loan.input';
import { LoanObject } from './graphql/loan.object';
import { LoansService } from './loans.service';

@Resolver(() => LoanObject)
export class LoansResolver {
  constructor(private readonly loansService: LoansService) {}

  @Query(() => [LoanObject])
  async loans(@CurrentUser() actor: JwtUser): Promise<LoanObject[]> {
    return this.loansService.listLoans(actor);
  }

  @Query(() => LoanObject)
  async loan(
    @Args('id') id: string,
    @CurrentUser() actor: JwtUser,
  ): Promise<LoanObject> {
    return this.loansService.getLoan(id, actor);
  }

  @Mutation(() => LoanObject)
  async createLoan(
    @Args('input', new ParseZodPipe(createLoanInputSchema))
    input: CreateLoanInput,
    @CurrentUser() actor: JwtUser,
  ): Promise<LoanObject> {
    return this.loansService.createLoan(input, actor);
  }
}
