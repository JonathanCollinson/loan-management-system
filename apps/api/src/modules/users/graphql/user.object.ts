import {
  Field,
  Float,
  ID,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { UserRole } from '../../../common/enums/user-role.enum';

registerEnumType(UserRole, { name: 'UserRole' });

@ObjectType()
export class UserObject {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field()
  name: string;

  @Field(() => UserRole)
  role: UserRole;

  @Field()
  isActive: boolean;

  @Field(() => Float)
  walletBalance: number;
}
