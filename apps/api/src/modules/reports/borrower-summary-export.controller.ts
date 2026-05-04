import {
  Controller,
  Get,
  Query,
  Req,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import type { JwtUser } from '../../common/types/jwt-user';
import { BorrowerSummaryExportService } from './borrower-summary-export.service';

@Controller('reports')
@UseGuards(AuthGuard('jwt'))
export class BorrowerSummaryExportController {
  constructor(private readonly exportService: BorrowerSummaryExportService) {}

  @Get('borrower-summary.xlsx')
  async borrowerSummaryXlsx(
    @Req() req: Request & { user: JwtUser },
    @Query('month') month?: string,
    @Query('principalFundId') principalFundId?: string,
    @Query('borrowerIds') borrowerIdsRaw?: string,
    @Query('createdFrom') createdFrom?: string,
    @Query('createdTo') createdTo?: string,
    @Query('allFunds') allFundsRaw?: string,
  ): Promise<StreamableFile> {
    const allFunds = allFundsRaw === 'true' || allFundsRaw === '1';
    const borrowerIds = borrowerIdsRaw
      ? borrowerIdsRaw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;
    const buf = await this.exportService.buildBorrowerSummaryXlsxBuffer(
      req.user,
      {
        month,
        principalFundId,
        borrowerIds,
        createdFrom,
        createdTo,
        allFunds,
      },
    );
    return new StreamableFile(buf, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: 'attachment; filename="borrower-loan-summary.xlsx"',
    });
  }
}
