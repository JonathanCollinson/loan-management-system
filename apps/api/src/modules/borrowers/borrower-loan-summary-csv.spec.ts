import { BorrowerLoanSummaryStatus } from '../../common/enums/borrower-loan-summary-status.enum';
import {
  escapeCsvCell,
  formatBorrowerLoanSummaryCsvAllFunds,
  formatBorrowerLoanSummaryCsvSingle,
} from './borrower-loan-summary-csv';

describe('borrower-loan-summary-csv', () => {
  it('escapeCsvCell quotes commas', () => {
    expect(escapeCsvCell('a,b')).toBe('"a,b"');
    expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""');
  });

  const samplePayload = {
    rows: [
      {
        borrowerId: 'b1',
        name: 'Ada, Lovelace',
        phone: null,
        address: '1 Lane',
        totalPrincipal: 100,
        totalInterest: 10,
        totalRepayable: 110,
        totalOutstanding: 50,
        borrowerStatus: BorrowerLoanSummaryStatus.OUTSTANDING,
        paidAt: undefined,
      },
    ],
    totals: {
      totalPrincipal: 100,
      totalInterest: 10,
      totalRepayable: 110,
    },
  };

  it('formatBorrowerLoanSummaryCsvSingle includes header and totals', () => {
    const csv = formatBorrowerLoanSummaryCsvSingle(samplePayload);
    expect(csv).toContain('borrowerId');
    expect(csv).toContain('Ada, Lovelace');
    expect(csv).toContain('TOTAL');
    expect(csv).toContain('100');
  });

  it('formatBorrowerLoanSummaryCsvAllFunds includes fund columns', () => {
    const csv = formatBorrowerLoanSummaryCsvAllFunds([
      {
        fundId: 'f1',
        fundName: 'Fund One',
        payload: samplePayload,
      },
    ]);
    expect(csv).toContain('capitalFundId');
    expect(csv).toContain('f1');
    expect(csv).toContain('Fund One');
  });
});
