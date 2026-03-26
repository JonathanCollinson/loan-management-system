import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsOptional, IsString } from 'class-validator';

@InputType()
export class CreateBorrowerInput {
  @Field()
  @IsString()
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  phone?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  idDocument?: string;

  /** Required when caller is ADMIN or SUPER_ADMIN — field user who owns this borrower. */
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  ownerUserId?: string;
}
