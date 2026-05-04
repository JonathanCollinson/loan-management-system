import { BadRequestException } from '@nestjs/common';
import {
  parseDateOnlyLocalEndOfDay,
  resolveLoanCreatedAtBounds,
} from './loan-created-range.util';

describe('loan-created-range.util', () => {
  it('parseDateOnlyLocalEndOfDay start of day', () => {
    const d = parseDateOnlyLocalEndOfDay('2026-03-15', false);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(2);
    expect(d.getDate()).toBe(15);
    expect(d.getHours()).toBe(0);
  });

  it('parseDateOnlyLocalEndOfDay end of day', () => {
    const d = parseDateOnlyLocalEndOfDay('2026-03-15', true);
    expect(d.getHours()).toBe(23);
    expect(d.getMinutes()).toBe(59);
  });

  it('resolveLoanCreatedAtBounds uses month', () => {
    const { start, end } = resolveLoanCreatedAtBounds({ month: '2026-02' });
    expect(start!.getMonth()).toBe(1);
    expect(end!.getMonth()).toBe(1);
  });

  it('resolveLoanCreatedAtBounds rejects month with date range', () => {
    expect(() =>
      resolveLoanCreatedAtBounds({
        month: '2026-02',
        createdFrom: '2026-01-01',
      }),
    ).toThrow(BadRequestException);
  });

  it('resolveLoanCreatedAtBounds rejects inverted range', () => {
    expect(() =>
      resolveLoanCreatedAtBounds({
        createdFrom: '2026-03-10',
        createdTo: '2026-03-01',
      }),
    ).toThrow(BadRequestException);
  });

  it('resolveLoanCreatedAtBounds allows open-ended start', () => {
    const { start, end } = resolveLoanCreatedAtBounds({
      createdTo: '2026-03-31',
    });
    expect(start).toBeUndefined();
    expect(end).toBeDefined();
  });
});
