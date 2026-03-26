import { BorrowerLoanSummaryStatus } from '../../common/enums/borrower-loan-summary-status.enum';
import { LoanStatus } from '../../common/enums/loan-status.enum';
import {
  LoanSummarySlice,
  summarizeBorrowerLoans,
} from './borrower-loan-summary.util';

describe('summarizeBorrowerLoans', () => {
  const base = (over: Partial<LoanSummarySlice>): LoanSummarySlice => ({
    principalAmount: 100,
    interestAmount: 10,
    totalAmount: 110,
    outstandingAmount: 0,
    status: LoanStatus.PAID,
    paidAt: new Date('2024-01-01'),
    ...over,
  });

  it('returns NO_LOANS when there are no loans', () => {
    const r = summarizeBorrowerLoans([]);
    expect(r.borrowerStatus).toBe(BorrowerLoanSummaryStatus.NO_LOANS);
    expect(r.totalPrincipal).toBe(0);
    expect(r.paidAt).toBeUndefined();
  });

  it('aggregates two loans for same borrower and marks PAID when all settled', () => {
    const r = summarizeBorrowerLoans([
      base({
        principalAmount: 100,
        interestAmount: 10,
        totalAmount: 110,
        outstandingAmount: 0,
        status: LoanStatus.PAID,
        paidAt: new Date('2024-01-02'),
      }),
      base({
        principalAmount: 50,
        interestAmount: 5,
        totalAmount: 55,
        outstandingAmount: 0,
        status: LoanStatus.PAID,
        paidAt: new Date('2024-01-10'),
      }),
    ]);
    expect(r.totalPrincipal).toBe(150);
    expect(r.totalInterest).toBe(15);
    expect(r.totalRepayable).toBe(165);
    expect(r.borrowerStatus).toBe(BorrowerLoanSummaryStatus.PAID);
    expect(r.paidAt?.toISOString()).toBe(new Date('2024-01-10').toISOString());
  });

  it('marks OUTSTANDING when one loan is not fully paid', () => {
    const r = summarizeBorrowerLoans([
      base({
        outstandingAmount: 0,
        status: LoanStatus.PAID,
      }),
      base({
        outstandingAmount: 20,
        status: LoanStatus.ACTIVE,
      }),
    ]);
    expect(r.borrowerStatus).toBe(BorrowerLoanSummaryStatus.OUTSTANDING);
    expect(r.paidAt).toBeUndefined();
  });

  it('marks OUTSTANDING when status is PAID but outstanding is non-zero', () => {
    const r = summarizeBorrowerLoans([
      base({
        outstandingAmount: 1,
        status: LoanStatus.PAID,
      }),
    ]);
    expect(r.borrowerStatus).toBe(BorrowerLoanSummaryStatus.OUTSTANDING);
  });
});
