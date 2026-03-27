import { Field, Float, ID, ObjectType } from '@nestjs/graphql';
import { CapitalFundPolicyObject } from './capital-fund-policy.object';

@ObjectType()
export class CapitalFundObject {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field(() => Float)
  balance: number;

  @Field()
  isActive: boolean;

  @Field(() => CapitalFundPolicyObject)
  policy: CapitalFundPolicyObject;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
