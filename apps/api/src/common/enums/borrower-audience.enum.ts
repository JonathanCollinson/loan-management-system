/** Who can see and use this borrower (besides admins, who see all). */
export enum BorrowerAudience {
  /** Only the owning field user (default). */
  OWNER_ONLY = 'OWNER_ONLY',
  /** Visible to all field users; any field user may originate loans (their wallet). */
  ALL_FIELD_USERS = 'ALL_FIELD_USERS',
  /** Only admins manage; field users cannot list or access. */
  ADMINS_ONLY = 'ADMINS_ONLY',
}
