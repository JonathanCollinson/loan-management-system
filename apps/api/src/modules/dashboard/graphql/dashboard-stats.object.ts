import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class DashboardStats {
  @Field(() => Float)
  totalPrincipalLoaned: number;

  @Field(() => Float)
  totalInterestExpected: number;

  @Field(() => Float)
  totalOutstanding: number;

  @Field(() => Float)
  totalCollected: number;

  @Field(() => Float)
  activeLoansCount: number;
}
