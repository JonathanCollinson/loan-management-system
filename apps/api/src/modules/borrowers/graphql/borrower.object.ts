import { Field, ID, ObjectType } from '@nestjs/graphql';
import { BorrowerAudience } from '../../../common/enums/borrower-audience.enum';

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

  @Field(() => BorrowerAudience)
  audience: BorrowerAudience;
}
