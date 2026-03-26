import { Field, Float, InputType, Int } from '@nestjs/graphql';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { InterestType } from '../../../common/enums/interest-type.enum';

@InputType()
export class CreateLoanInput {
  @Field()
  @IsString()
  borrowerId: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0.01)
  principalAmount: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  interestRate?: number;

  @Field(() => InterestType)
  @IsEnum(InterestType)
  interestType: InterestType;

  @Field(() => Int)
  @IsNumber()
  @Min(1)
  termMonths: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  startDate?: string;
}
