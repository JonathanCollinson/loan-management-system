import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class UpdateBorrowerInput {
  @Field()
  borrowerId: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  address?: string;
}
