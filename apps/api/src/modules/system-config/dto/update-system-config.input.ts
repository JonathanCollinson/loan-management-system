import { Field, Float, InputType } from '@nestjs/graphql';
import { IsNumber, Min } from 'class-validator';

@InputType()
export class UpdateSystemConfigInput {
  @Field(() => Float)
  @IsNumber()
  @Min(0)
  defaultInterestRate: number;
}
