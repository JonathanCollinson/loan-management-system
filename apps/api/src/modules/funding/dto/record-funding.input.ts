import { Field, Float, InputType } from '@nestjs/graphql';

@InputType()
export class RecordFundingInput {
  @Field()
  recipientUserId: string;

  @Field(() => Float)
  amount: number;

  @Field({ nullable: true })
  note?: string;

  @Field({ nullable: true })
  period?: string;
}
