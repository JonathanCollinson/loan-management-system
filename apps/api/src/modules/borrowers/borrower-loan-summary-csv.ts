import type {
  BorrowerLoanSummaryPayload,
  BorrowerLoanSummaryRow,
} from './graphql/borrower-loan-summary.object';

export function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

const BASE_HEADERS = [
  'borrowerId',
  'name',
  'phone',
  'address',
  'totalPrincipal',
  'totalInterest',
  'totalRepayable',
  'totalOutstanding',
  'borrowerStatus',
  'paidAt',
] as const;

function rowToCsvCells(
  includeFund: boolean,
  fundId: string,
  fundName: string,
  row: BorrowerLoanSummaryRow,
): string[] {
  const paid =
    row.paidAt instanceof Date
      ? row.paidAt.toISOString()
      : row.paidAt
        ? new Date(row.paidAt as unknown as string).toISOString()
        : '';
  const cells = [
    row.borrowerId,
    row.name,
    row.phone ?? '',
    row.address,
    String(row.totalPrincipal),
    String(row.totalInterest),
    String(row.totalRepayable),
    String(row.totalOutstanding),
    row.borrowerStatus,
    paid,
  ];
  if (includeFund) {
    return [fundId, fundName, ...cells].map(escapeCsvCell);
  }
  return cells.map(escapeCsvCell);
}

function totalsCells(
  includeFund: boolean,
  fundId: string,
  fundName: string,
  totals: BorrowerLoanSummaryPayload['totals'],
): string[] {
  const cells = [
    '',
    'TOTAL',
    '',
    '',
    String(totals.totalPrincipal),
    String(totals.totalInterest),
    String(totals.totalRepayable),
    '',
    '',
    '',
  ];
  if (includeFund) {
    return [fundId, fundName, ...cells].map(escapeCsvCell);
  }
  return cells.map(escapeCsvCell);
}

/** One table: optional fund columns, data rows, one totals row. */
export function formatBorrowerLoanSummaryCsvTable(opts: {
  includeFundColumns: boolean;
  fundId?: string;
  fundName?: string;
  payload: BorrowerLoanSummaryPayload;
  /** When false, caller will add header separately (multi-fund single CSV). */
  includeHeader: boolean;
}): string {
  const {
    includeFundColumns,
    fundId = '',
    fundName = '',
    payload,
    includeHeader,
  } = opts;
  const headers = includeFundColumns
    ? ['capitalFundId', 'capitalFundName', ...BASE_HEADERS]
    : [...BASE_HEADERS];
  const lines: string[] = [];
  if (includeHeader) {
    lines.push(headers.map(escapeCsvCell).join(','));
  }
  for (const row of payload.rows) {
    lines.push(
      rowToCsvCells(includeFundColumns, fundId, fundName, row).join(','),
    );
  }
  if (payload.rows.length > 0) {
    lines.push(
      totalsCells(includeFundColumns, fundId, fundName, payload.totals).join(
        ',',
      ),
    );
  }
  return lines.join('\n');
}

/** Full CSV for a single aggregated fund scope (no fund columns). */
export function formatBorrowerLoanSummaryCsvSingle(
  payload: BorrowerLoanSummaryPayload,
): string {
  return formatBorrowerLoanSummaryCsvTable({
    includeFundColumns: false,
    payload,
    includeHeader: true,
  });
}

/** One combined CSV: header once, then per-fund blocks with fund columns and subtotals. */
export function formatBorrowerLoanSummaryCsvAllFunds(
  sections: {
    fundId: string;
    fundName: string;
    payload: BorrowerLoanSummaryPayload;
  }[],
): string {
  const headers = ['capitalFundId', 'capitalFundName', ...BASE_HEADERS].map(
    escapeCsvCell,
  );
  const lines: string[] = [headers.join(',')];
  for (const { fundId, fundName, payload } of sections) {
    if (payload.rows.length === 0) continue;
    lines.push(
      formatBorrowerLoanSummaryCsvTable({
        includeFundColumns: true,
        fundId,
        fundName,
        payload,
        includeHeader: false,
      }),
    );
  }
  return lines.join('\n');
}
