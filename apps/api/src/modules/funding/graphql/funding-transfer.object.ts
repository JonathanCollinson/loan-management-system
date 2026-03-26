import { Field, Float, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class FundingTransferObject {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  adminUserId: string;

  @Field(() => ID)
  recipientUserId: string;

  @Field(() => Float)
  amount: number;

  @Field({ nullable: true })
  note?: string;

  @Field({ nullable: true })
  period?: string;

  @Field()
  createdAt: Date;
}
