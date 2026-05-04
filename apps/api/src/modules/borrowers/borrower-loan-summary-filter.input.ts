import type { BorrowerLoanSummaryPayload } from './graphql/borrower-loan-summary.object';

/** Filters shared by borrowerLoanSummary, CSV export, and XLSX download. */
export interface BorrowerLoanSummaryFilterInput {
  month?: string | null;
  principalFundId?: string | null;
  borrowerIds?: string[] | null;
  createdFrom?: string | null;
  createdTo?: string | null;
}

export type BorrowerLoanSummaryCsvOptions = BorrowerLoanSummaryFilterInput & {
  /** When true, emit one section per accessible fund (rows include fund columns). */
  allFunds?: boolean | null;
};

export type PerFundBorrowerLoanSummary = {
  fundId: string;
  fundName: string;
  payload: BorrowerLoanSummaryPayload;
};
