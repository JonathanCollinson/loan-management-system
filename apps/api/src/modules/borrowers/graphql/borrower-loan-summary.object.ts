import {
  Field,
  Float,
  ID,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { BorrowerLoanSummaryStatus } from '../../../common/enums/borrower-loan-summary-status.enum';

registerEnumType(BorrowerLoanSummaryStatus, {
  name: 'BorrowerLoanSummaryStatus',
});

@ObjectType()
export class BorrowerLoanSummaryTotals {
  @Field(() => Float)
  totalPrincipal: number;

  @Field(() => Float)
  totalInterest: number;

  @Field(() => Float)
  totalRepayable: number;
}

@ObjectType()
export class BorrowerLoanSummaryRow {
  @Field(() => ID)
  borrowerId: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  phone?: string;

  @Field()
  address: string;

  @Field(() => Float)
  totalPrincipal: number;

  @Field(() => Float)
  totalInterest: number;

  @Field(() => Float)
  totalRepayable: number;

  @Field(() => Float)
  totalOutstanding: number;

  @Field(() => BorrowerLoanSummaryStatus)
  borrowerStatus: BorrowerLoanSummaryStatus;

  @Field({ nullable: true })
  paidAt?: Date;
}

@ObjectType()
export class BorrowerLoanSummaryPayload {
  @Field(() => [BorrowerLoanSummaryRow])
  rows: BorrowerLoanSummaryRow[];

  @Field(() => BorrowerLoanSummaryTotals)
  totals: BorrowerLoanSummaryTotals;
}
