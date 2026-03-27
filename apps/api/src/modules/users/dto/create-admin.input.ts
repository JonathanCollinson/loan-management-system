import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateAdminInput {
  @Field()
  email: string;

  @Field()
  password: string;

  @Field()
  name: string;
}
