import { Field, InputType } from '@nestjs/graphql';
import { CapitalFundPolicyInput } from './create-capital-fund.input';

@InputType()
export class UpdateCapitalFundInput {
  @Field()
  fundId: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  isActive?: boolean;

  @Field(() => CapitalFundPolicyInput, { nullable: true })
  policy?: CapitalFundPolicyInput;
}
