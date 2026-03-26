import { Field, Float, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { InterestType } from '../../../common/enums/interest-type.enum';
import { LoanStatus } from '../../../common/enums/loan-status.enum';

registerEnumType(InterestType, { name: 'InterestType' });
registerEnumType(LoanStatus, { name: 'LoanStatus' });

@ObjectType()
export class LoanObject {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  borrowerId: string;

  @Field(() => ID)
  ownerUserId: string;

  @Field(() => Float)
  principalAmount: number;

  @Field(() => Float)
  interestRate: number;

  @Field(() => InterestType)
  interestType: InterestType;

  @Field(() => Float)
  interestAmount: number;

  @Field(() => Float)
  totalAmount: number;

  @Field()
  termMonths: number;

  @Field()
  startDate: Date;

  @Field()
  endDate: Date;

  @Field(() => Float)
  monthlyInstallment: number;

  @Field(() => LoanStatus)
  status: LoanStatus;

  @Field(() => Float)
  totalPaid: number;

  @Field(() => Float)
  outstandingAmount: number;

  @Field({ nullable: true })
  paidAt?: Date;
}
