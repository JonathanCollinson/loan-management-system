import { Field, Float, InputType } from '@nestjs/graphql';

@InputType()
export class DepositToCapitalFundInput {
  @Field()
  fundId: string;

  @Field(() => Float)
  amount: number;

  @Field({ nullable: true })
  note?: string;
}
