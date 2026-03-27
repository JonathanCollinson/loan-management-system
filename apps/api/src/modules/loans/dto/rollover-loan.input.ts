import { Field, Float, InputType } from '@nestjs/graphql';

@InputType()
export class RolloverLoanInput {
  @Field()
  loanId: string;

  /** Extra interest as % of current outstanding (overrides fund policy default). */
  @Field(() => Float, { nullable: true })
  interestPercentOnOutstanding?: number;
}
