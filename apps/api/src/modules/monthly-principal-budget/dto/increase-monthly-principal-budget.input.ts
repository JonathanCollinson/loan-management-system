import { Field, Float, InputType } from '@nestjs/graphql';
import { IsNumber, IsOptional, IsString, Matches, Min } from 'class-validator';

@InputType()
export class IncreaseMonthlyPrincipalBudgetInput {
  @Field()
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'month must be YYYY-MM' })
  month: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0.01)
  delta: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  note?: string;
}
