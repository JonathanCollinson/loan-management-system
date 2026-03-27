import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { InterestType } from '../../../common/enums/interest-type.enum';

@InputType()
export class CreateLoanInput {
  @Field()
  borrowerId: string;

  @Field(() => Float)
  principalAmount: number;

  @Field(() => Float, { nullable: true })
  interestRate?: number;

  @Field(() => InterestType)
  interestType: InterestType;

  @Field(() => Int)
  termMonths: number;

  @Field({ nullable: true })
  startDate?: string;
}
