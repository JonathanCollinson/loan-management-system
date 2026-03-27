import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CapitalFundDetailSummary {
  @Field(() => ID)
  fundId: string;

  @Field()
  fundName: string;

  @Field(() => Float)
  fundBalance: number;

  /** Sum of field-user per-fund allocations (admin-only; null for field users). */
  @Field(() => Float, { nullable: true })
  totalAllocatedToFieldUsers?: number | null;

  @Field(() => Float)
  principalLoaned: number;

  @Field(() => Float)
  totalInterestExpected: number;

  @Field(() => Float)
  totalOutstanding: number;

  @Field(() => Float)
  totalCollected: number;

  @Field(() => Int)
  activeLoansCount: number;
}
