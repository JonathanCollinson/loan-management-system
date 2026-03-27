import { Field, Float, InputType } from '@nestjs/graphql';

@InputType()
export class SetMonthlyPrincipalBudgetInput {
  @Field()
  month: string;

  @Field(() => Float)
  totalPrincipal: number;

  @Field({ nullable: true })
  note?: string;
}
