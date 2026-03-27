import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import {
  createLoanInputSchema,
  rolloverLoanInputSchema,
  updateLoanInputSchema,
} from '@lms/validation';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import type { JwtUser } from '../../common/types/jwt-user';
import { ParseZodPipe } from '../../common/pipes/parse-zod.pipe';
import { CreateLoanInput } from './dto/create-loan.input';
import { RolloverLoanInput } from './dto/rollover-loan.input';
import { UpdateLoanInput } from './dto/update-loan.input';
import { LoanObject } from './graphql/loan.object';
import { LoansService } from './loans.service';
import { CapitalFundsService } from '../capital-funds/capital-funds.service';

@Resolver(() => LoanObject)
export class LoansResolver {
  constructor(
    private readonly loansService: LoansService,
    private readonly capitalFundsService: CapitalFundsService,
  ) {}

  @ResolveField(() => String, { nullable: true })
  async principalFundName(@Parent() loan: LoanObject): Promise<string | null> {
    if (!loan.principalFundId) return null;
    try {
      const f = await this.capitalFundsService.getFund(loan.principalFundId);
      return f.name;
    } catch {
      return null;
    }
  }

  @Query(() => [LoanObject])
  async loans(
    @CurrentUser() actor: JwtUser,
    @Args('principalFundId', { nullable: true }) principalFundId?: string,
    @Args('month', { nullable: true }) month?: string,
  ): Promise<LoanObject[]> {
    return this.loansService.listLoans(actor, principalFundId, month);
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

  @Mutation(() => LoanObject)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async updateLoan(
    @Args('input', new ParseZodPipe(updateLoanInputSchema))
    input: UpdateLoanInput,
    @CurrentUser() actor: JwtUser,
  ): Promise<LoanObject> {
    return this.loansService.updateLoan(input, actor);
  }

  @Mutation(() => LoanObject)
  async rolloverLoan(
    @Args('input', new ParseZodPipe(rolloverLoanInputSchema))
    input: RolloverLoanInput,
    @CurrentUser() actor: JwtUser,
  ): Promise<LoanObject> {
    return this.loansService.rolloverLoan(input, actor);
  }
}
