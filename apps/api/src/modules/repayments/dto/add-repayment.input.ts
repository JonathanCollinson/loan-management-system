import { Field, Float, InputType } from '@nestjs/graphql';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PaymentMethod } from '../../../common/enums/payment-method.enum';

@InputType()
export class AddRepaymentInput {
  @Field()
  @IsString()
  loanId: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0.01)
  amount: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @Field(() => PaymentMethod)
  @IsEnum(PaymentMethod)
  method: PaymentMethod;
}
