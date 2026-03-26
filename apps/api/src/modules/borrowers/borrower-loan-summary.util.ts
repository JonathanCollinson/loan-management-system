import { BorrowerLoanSummaryStatus } from '../../common/enums/borrower-loan-summary-status.enum';
import { LoanStatus } from '../../common/enums/loan-status.enum';

export type LoanSummarySlice = {
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  outstandingAmount: number;
  status: LoanStatus;
  paidAt?: Date;
};

export function summarizeBorrowerLoans(loans: LoanSummarySlice[]): {
  totalPrincipal: number;
  totalInterest: number;
  totalRepayable: number;
  totalOutstanding: number;
  borrowerStatus: BorrowerLoanSummaryStatus;
  paidAt?: Date;
} {
  if (loans.length === 0) {
    return {
      totalPrincipal: 0,
      totalInterest: 0,
      totalRepayable: 0,
      totalOutstanding: 0,
      borrowerStatus: BorrowerLoanSummaryStatus.NO_LOANS,
    };
  }

  let totalPrincipal = 0;
  let totalInterest = 0;
  let totalRepayable = 0;
  let totalOutstanding = 0;
  for (const l of loans) {
    totalPrincipal += l.principalAmount;
    totalInterest += l.interestAmount;
    totalRepayable += l.totalAmount;
    totalOutstanding += l.outstandingAmount;
  }

  const allPaid = loans.every(
    (l) => l.status === LoanStatus.PAID && l.outstandingAmount === 0,
  );

  if (allPaid) {
    const paidDates = loans
      .map((l) => l.paidAt)
      .filter((d): d is Date => d != null);
    const paidAt =
      paidDates.length === 0
        ? undefined
        : new Date(Math.max(...paidDates.map((d) => d.getTime())));

    return {
      totalPrincipal,
      totalInterest,
      totalRepayable,
      totalOutstanding,
      borrowerStatus: BorrowerLoanSummaryStatus.PAID,
      paidAt,
    };
  }

  return {
    totalPrincipal,
    totalInterest,
    totalRepayable,
    totalOutstanding,
    borrowerStatus: BorrowerLoanSummaryStatus.OUTSTANDING,
  };
}
