import { Field, Float, InputType } from '@nestjs/graphql';

@InputType()
export class IncreaseMonthlyPrincipalBudgetInput {
  @Field()
  month: string;

  @Field(() => Float)
  delta: number;

  @Field({ nullable: true })
  note?: string;
}
