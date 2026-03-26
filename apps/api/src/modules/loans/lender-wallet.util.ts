import { UserRole } from '../../common/enums/user-role.enum';
import type { JwtUser } from '../../common/types/jwt-user';

/** Who supplies principal from their wallet when originating a loan. */
export function resolveLenderWalletUserId(
  actor: JwtUser,
  borrowerOwnerUserId: string,
): string {
  if (actor.role === UserRole.ADMIN || actor.role === UserRole.SUPER_ADMIN) {
    return actor.id;
  }
  return borrowerOwnerUserId;
}
