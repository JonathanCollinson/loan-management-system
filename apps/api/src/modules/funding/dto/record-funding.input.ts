import { Field, Float, ID, InputType } from '@nestjs/graphql';

@InputType()
export class RecordFundingInput {
  @Field()
  recipientUserId: string;

  /** Capital pool this allocation is drawn from. */
  @Field(() => ID)
  capitalFundId: string;

  @Field(() => Float)
  amount: number;

  @Field({ nullable: true })
  note?: string;

  @Field({ nullable: true })
  period?: string;
}
