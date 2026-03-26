import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class BorrowerObject {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  phone?: string;

  @Field()
  address: string;

  @Field(() => ID)
  createdByUserId: string;
}
