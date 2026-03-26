import { Field, Float, InputType } from '@nestjs/graphql';
import { IsNumber, IsOptional, IsString, Matches, Min } from 'class-validator';

@InputType()
export class RecordFundingInput {
  @Field()
  @IsString()
  recipientUserId: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0.01)
  amount: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  note?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'period must be YYYY-MM' })
  period?: string;
}
