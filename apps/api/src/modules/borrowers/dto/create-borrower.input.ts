import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

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
}
