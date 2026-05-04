import { BadRequestException } from '@nestjs/common';
import { parseMonth } from './month-range.util';

/** Inclusive local calendar day bounds for loan createdAt filtering. */
export function parseDateOnlyLocalEndOfDay(
  dateStr: string,
  endOfDay: boolean,
): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!m) {
    throw new BadRequestException(
      'createdFrom and createdTo must be YYYY-MM-DD when provided',
    );
  }
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const day = Number(m[3]);
  if (
    !Number.isInteger(y) ||
    !Number.isInteger(mo) ||
    !Number.isInteger(day) ||
    mo < 1 ||
    mo > 12 ||
    day < 1 ||
    day > 31
  ) {
    throw new BadRequestException('Invalid createdFrom or createdTo date');
  }
  if (endOfDay) {
    return new Date(y, mo - 1, day, 23, 59, 59, 999);
  }
  return new Date(y, mo - 1, day, 0, 0, 0, 0);
}

/**
 * Resolves loan createdAt bounds. Throws when both month and custom dates are set.
 */
export function resolveLoanCreatedAtBounds(input: {
  month?: string | null;
  createdFrom?: string | null;
  createdTo?: string | null;
}): { start?: Date; end?: Date } {
  const { month, createdFrom, createdTo } = input;
  const hasRange = Boolean(createdFrom || createdTo);
  if (month && hasRange) {
    throw new BadRequestException(
      'Do not pass month together with createdFrom or createdTo',
    );
  }
  if (month) {
    return parseMonth(month);
  }
  if (!createdFrom && !createdTo) {
    return {};
  }
  const start = createdFrom
    ? parseDateOnlyLocalEndOfDay(createdFrom, false)
    : undefined;
  const end = createdTo
    ? parseDateOnlyLocalEndOfDay(createdTo, true)
    : undefined;
  if (start && end && start.getTime() > end.getTime()) {
    throw new BadRequestException('createdFrom must be on or before createdTo');
  }
  return { start, end };
}
