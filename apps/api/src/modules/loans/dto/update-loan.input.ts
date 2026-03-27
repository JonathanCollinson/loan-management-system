import { Field, Float, InputType, Int } from '@nestjs/graphql';

@InputType()
export class UpdateLoanInput {
  @Field()
  loanId: string;

  @Field(() => Float, { nullable: true })
  interestRate?: number;

  @Field(() => Int, { nullable: true })
  termMonths?: number;
}
