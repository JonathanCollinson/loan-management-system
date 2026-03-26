import { Field, Float, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class FundingUtilizationRow {
  @Field(() => ID)
  userId: string;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field(() => Float)
  fundingAssigned: number;

  @Field(() => Float)
  principalLoaned: number;

  @Field(() => Float)
  walletBalance: number;
}

@ObjectType()
export class FundingUtilizationTotals {
  @Field(() => Float)
  fundingAssigned: number;

  @Field(() => Float)
  principalLoaned: number;
}

@ObjectType()
export class FundingUtilizationPayload {
  @Field()
  month: string;

  @Field(() => [FundingUtilizationRow])
  rows: FundingUtilizationRow[];

  @Field(() => FundingUtilizationTotals)
  totals: FundingUtilizationTotals;
}
