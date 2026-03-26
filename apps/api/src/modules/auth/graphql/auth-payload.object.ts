import { Field, ObjectType } from '@nestjs/graphql';
import { UserObject } from '../../users/graphql/user.object';

@ObjectType()
export class AuthPayload {
  @Field()
  accessToken: string;

  @Field(() => UserObject)
  user: UserObject;
}
