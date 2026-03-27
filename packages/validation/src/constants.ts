import { z } from 'zod';

/** Matches GraphQL `BorrowerAudience` */
export const borrowerAudienceSchema = z.enum([
  'OWNER_ONLY',
  'ALL_FIELD_USERS',
  'ADMINS_ONLY',
]);

/** Matches GraphQL `InterestType` */
export const interestTypeSchema = z.enum(['FLAT', 'REDUCING_BALANCE']);

/** Matches GraphQL `PaymentMethod` */
export const paymentMethodSchema = z.enum([
  'CASH',
  'BANK_TRANSFER',
  'MOBILE_MONEY',
  'OTHER',
]);

export const monthYYYYMMSchema = z
  .string()
  .regex(/^\d{4}-\d{2}$/, 'Must be YYYY-MM');

export const periodYYYYMMSchema = z
  .string()
  .regex(/^\d{4}-\d{2}$/, 'period must be YYYY-MM');
