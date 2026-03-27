import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateFieldUserInput {
  @Field()
  email: string;

  @Field()
  password: string;

  @Field()
  name: string;
}
