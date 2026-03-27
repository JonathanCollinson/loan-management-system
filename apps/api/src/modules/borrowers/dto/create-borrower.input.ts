import { Field, InputType } from '@nestjs/graphql';
import { BorrowerAudience } from '../../../common/enums/borrower-audience.enum';

@InputType()
export class CreateBorrowerInput {
  @Field()
  name: string;

  @Field({ nullable: true })
  phone?: string;

  @Field()
  address: string;

  /** Required when caller is ADMIN or SUPER_ADMIN — field user who owns this borrower. */
  @Field({ nullable: true })
  ownerUserId?: string;

  @Field(() => BorrowerAudience, { nullable: true })
  audience?: BorrowerAudience;
}
