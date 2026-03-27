import { Field, Float, InputType, Int } from '@nestjs/graphql';

@InputType()
export class CapitalFundPolicyInput {
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

@InputType()
export class CreateCapitalFundInput {
  @Field()
  name: string;

  @Field(() => CapitalFundPolicyInput, { nullable: true })
  policy?: CapitalFundPolicyInput;
}
