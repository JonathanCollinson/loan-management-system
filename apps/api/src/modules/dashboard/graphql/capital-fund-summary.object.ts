import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CapitalFundSummary {
  @Field(() => ID)
  fundId: string;

  @Field()
  fundName: string;

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
