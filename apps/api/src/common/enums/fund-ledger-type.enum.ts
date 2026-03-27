export enum FundLedgerType {
  DEPOSIT = 'DEPOSIT',
  DISBURSEMENT = 'DISBURSEMENT',
  REPAYMENT_IN = 'REPAYMENT_IN',
  /** Principal moved from pool to a field user's per-fund allocation (record funding). */
  FIELD_ALLOCATION = 'FIELD_ALLOCATION',
  ADJUSTMENT = 'ADJUSTMENT',
  INTEREST_ACCRUAL = 'INTEREST_ACCRUAL',
}
