import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CapitalFundPolicyObject {
  @Field(() => Float, { nullable: true })
  defaultFlatInterestRatePercent?: number;

  @Field(() => Int, { nullable: true })
  defaultTermMonths?: number;

  @Field(() => Float, { nullable: true })
  minPrincipal?: number;

  @Field(() => Float, { nullable: true })
  maxPrincipal?: number;

  @Field({ nullable: true })
  rolloverMode?: string;

  @Field(() => Float, { nullable: true })
  rolloverInterestOnOutstandingPercent?: number;
}
