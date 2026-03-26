import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

@InputType()
export class UpdateUserInput {
  @Field()
  @IsString()
  userId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
