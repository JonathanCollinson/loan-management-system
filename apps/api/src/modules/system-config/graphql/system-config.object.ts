import {
  Field,
  Float,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { GlobalRolloverMode } from '../../../common/enums/global-rollover-mode.enum';

registerEnumType(GlobalRolloverMode, { name: 'GlobalRolloverMode' });

@ObjectType()
export class SystemConfigObject {
  @Field(() => Float)
  defaultInterestRate: number;

  @Field(() => Int)
  defaultTermMonths: number;

  @Field(() => GlobalRolloverMode)
  globalRolloverMode: GlobalRolloverMode;
}
