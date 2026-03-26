import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { BorrowerAudience } from '../../../common/enums/borrower-audience.enum';

@InputType()
export class CreateBorrowerInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  phone?: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  address: string;

  /** Required when caller is ADMIN or SUPER_ADMIN — field user who owns this borrower. */
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  ownerUserId?: string;

  @Field(() => BorrowerAudience, { nullable: true })
  @IsOptional()
  @IsEnum(BorrowerAudience)
  audience?: BorrowerAudience;
}
