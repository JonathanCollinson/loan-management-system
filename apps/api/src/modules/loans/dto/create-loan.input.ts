import { Field, Float, ID, InputType, Int } from '@nestjs/graphql';
import { InterestType } from '../../../common/enums/interest-type.enum';

@InputType()
export class CreateLoanInput {
  @Field()
  borrowerId: string;

  @Field(() => ID)
  principalFundId: string;

  @Field(() => Float)
  principalAmount: number;

  @Field(() => Float, { nullable: true })
  interestRate?: number;

  @Field(() => InterestType)
  interestType: InterestType;

  @Field(() => Int, { nullable: true })
  termMonths?: number;

  @Field({ nullable: true })
  startDate?: string;
}
