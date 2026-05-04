import { BadRequestException, Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import type { JwtUser } from '../../common/types/jwt-user';
import type { BorrowerLoanSummaryPayload } from '../borrowers/graphql/borrower-loan-summary.object';
import { BorrowersService } from '../borrowers/borrowers.service';

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

export function sanitizeSheetName(name: string): string {
  const cleaned = name
    .replace(/[:\\/?*[\]]/g, ' ')
    .trim()
    .slice(0, 31);
  return cleaned || 'Sheet';
}

function writePayloadToWorksheet(
  ws: ExcelJS.Worksheet,
  payload: BorrowerLoanSummaryPayload,
) {
  ws.addRow([...BASE_HEADERS]);
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true };
  for (const row of payload.rows) {
    ws.addRow([
      row.borrowerId,
      row.name,
      row.phone ?? '',
      row.address,
      row.totalPrincipal,
      row.totalInterest,
      row.totalRepayable,
      row.totalOutstanding,
      row.borrowerStatus,
      row.paidAt ? new Date(row.paidAt).toISOString() : '',
    ]);
  }
  if (payload.rows.length > 0) {
    ws.addRow([
      '',
      'TOTAL',
      '',
      '',
      payload.totals.totalPrincipal,
      payload.totals.totalInterest,
      payload.totals.totalRepayable,
      '',
      '',
      '',
    ]);
  }
}

export type BorrowerSummaryXlsxQuery = {
  month?: string | null;
  principalFundId?: string | null;
  borrowerIds?: string[] | null;
  createdFrom?: string | null;
  createdTo?: string | null;
  allFunds?: boolean;
};

@Injectable()
export class BorrowerSummaryExportService {
  constructor(private readonly borrowersService: BorrowersService) {}

  async buildBorrowerSummaryXlsxBuffer(
    actor: JwtUser,
    q: BorrowerSummaryXlsxQuery,
  ): Promise<Buffer> {
    const filter = {
      month: q.month ?? undefined,
      principalFundId: q.principalFundId ?? undefined,
      borrowerIds: q.borrowerIds?.length ? q.borrowerIds : undefined,
      createdFrom: q.createdFrom ?? undefined,
      createdTo: q.createdTo ?? undefined,
    };

    const workbook = new ExcelJS.Workbook();

    if (q.allFunds) {
      if (q.principalFundId) {
        throw new BadRequestException(
          'Do not pass principalFundId when allFunds is true',
        );
      }
      const sections =
        await this.borrowersService.listBorrowerLoanSummaryPerFund(
          actor,
          filter,
        );
      let added = 0;
      for (const s of sections) {
        if (s.payload.rows.length === 0) continue;
        const ws = workbook.addWorksheet(sanitizeSheetName(s.fundName));
        writePayloadToWorksheet(ws, s.payload);
        added++;
      }
      if (added === 0) {
        const ws = workbook.addWorksheet('Summary');
        writePayloadToWorksheet(ws, {
          rows: [],
          totals: {
            totalPrincipal: 0,
            totalInterest: 0,
            totalRepayable: 0,
          },
        });
      }
    } else {
      const payload = await this.borrowersService.getBorrowerLoanSummary(
        actor,
        filter,
      );
      const title = filter.principalFundId ? 'Fund summary' : 'Summary';
      const ws = workbook.addWorksheet(sanitizeSheetName(title));
      writePayloadToWorksheet(ws, payload);
    }

    const buf = await workbook.xlsx.writeBuffer();
    return Buffer.from(buf);
  }
}
