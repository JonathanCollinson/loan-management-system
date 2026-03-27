import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class UpdateUserInput {
  @Field()
  userId: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  isActive?: boolean;

  @Field({ nullable: true })
  password?: string;
}
