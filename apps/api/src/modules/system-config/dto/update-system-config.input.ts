import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { GlobalRolloverMode } from '../../../common/enums/global-rollover-mode.enum';

@InputType()
export class UpdateSystemConfigInput {
  @Field(() => Float, { nullable: true })
  defaultInterestRate?: number;

  @Field(() => Int, { nullable: true })
  defaultTermMonths?: number;

  @Field(() => GlobalRolloverMode, { nullable: true })
  globalRolloverMode?: GlobalRolloverMode;
}
