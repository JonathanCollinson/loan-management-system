import { BadRequestException } from '@nestjs/common';

/** Inclusive calendar month range for reporting (local timezone). */
export function parseMonth(month: string): { start: Date; end: Date } {
  const m = /^(\d{4})-(\d{2})$/.exec(month);
  if (!m) {
    throw new BadRequestException('month must be YYYY-MM');
  }
  const y = Number(m[1]);
  const mo = Number(m[2]);
  if (mo < 1 || mo > 12) {
    throw new BadRequestException('Invalid month');
  }
  const start = new Date(y, mo - 1, 1, 0, 0, 0, 0);
  const end = new Date(y, mo, 0, 23, 59, 59, 999);
  return { start, end };
}
