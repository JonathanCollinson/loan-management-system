import { BorrowerAudience } from '../../common/enums/borrower-audience.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import type { JwtUser } from '../../common/types/jwt-user';

/** Who supplies principal from their wallet when originating a loan. */
export function resolveLenderWalletUserId(
  actor: JwtUser,
  borrowerOwnerUserId: string,
  borrowerAudience?: BorrowerAudience,
): string {
  if (actor.role === UserRole.ADMIN || actor.role === UserRole.SUPER_ADMIN) {
    return actor.id;
  }
  if (borrowerAudience === BorrowerAudience.ALL_FIELD_USERS) {
    return actor.id;
  }
  return borrowerOwnerUserId;
}
