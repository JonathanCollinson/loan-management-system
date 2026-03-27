import { Field, Float, InputType } from '@nestjs/graphql';

@InputType()
export class UpdateSystemConfigInput {
  @Field(() => Float)
  defaultInterestRate: number;
}
