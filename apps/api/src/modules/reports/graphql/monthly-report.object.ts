import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class MonthlyReport {
  @Field()
  month: string;

  @Field(() => Int)
  loansIssued: number;

  @Field(() => Float)
  principalLoaned: number;

  @Field(() => Int)
  repaymentsCount: number;

  @Field(() => Float)
  paymentsReceived: number;
}
