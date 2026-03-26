import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SystemConfigObject {
  @Field(() => Float)
  defaultInterestRate: number;
}
