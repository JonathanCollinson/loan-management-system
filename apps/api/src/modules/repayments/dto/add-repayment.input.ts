import { Field, Float, InputType } from '@nestjs/graphql';
import { PaymentMethod } from '../../../common/enums/payment-method.enum';

@InputType()
export class AddRepaymentInput {
  @Field()
  loanId: string;

  @Field(() => Float)
  amount: number;

  @Field({ nullable: true })
  paymentDate?: string;

  @Field(() => PaymentMethod)
  method: PaymentMethod;
}
