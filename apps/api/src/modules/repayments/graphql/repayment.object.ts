import {
  Field,
  Float,
  ID,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { PaymentMethod } from '../../../common/enums/payment-method.enum';

registerEnumType(PaymentMethod, { name: 'PaymentMethod' });

@ObjectType()
export class RepaymentObject {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  loanId: string;

  @Field(() => Float)
  amount: number;

  @Field()
  paymentDate: Date;

  @Field(() => PaymentMethod)
  method: PaymentMethod;
}
