import { getToken } from './auth-storage';
import { apiBaseUrlFromEnv } from './graphql-api-base';

export type BorrowerSummaryExportFilters = {
  month?: string | null;
  principalFundId?: string | null;
  borrowerIds?: string[] | null;
  createdFrom?: string | null;
  createdTo?: string | null;
  allFunds?: boolean;
};

export async function downloadBorrowerSummaryXlsx(
  filters: BorrowerSummaryExportFilters,
  filename = 'borrower-loan-summary.xlsx',
): Promise<void> {
  const base = apiBaseUrlFromEnv();
  const q = new URLSearchParams();
  if (filters.month) q.set('month', filters.month);
  if (filters.principalFundId)
    q.set('principalFundId', filters.principalFundId);
  if (filters.createdFrom) q.set('createdFrom', filters.createdFrom);
  if (filters.createdTo) q.set('createdTo', filters.createdTo);
  if (filters.borrowerIds?.length) {
    q.set('borrowerIds', filters.borrowerIds.join(','));
  }
  if (filters.allFunds) q.set('allFunds', 'true');

  const token = getToken();
  const res = await fetch(`${base}/reports/borrower-summary.xlsx?${q}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Download failed (${res.status})`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
