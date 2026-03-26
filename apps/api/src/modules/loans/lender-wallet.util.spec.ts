import { BorrowerAudience } from '../../common/enums/borrower-audience.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import type { JwtUser } from '../../common/types/jwt-user';
import { resolveLenderWalletUserId } from './lender-wallet.util';

function user(id: string, role: UserRole, email = 'x@test'): JwtUser {
  return { id, email, role };
}

describe('resolveLenderWalletUserId', () => {
  it('debits the field user (borrower owner) when actor is USER', () => {
    expect(
      resolveLenderWalletUserId(user('u1', UserRole.USER), 'owner-1'),
    ).toBe('owner-1');
  });

  it('debits the acting field user when borrower is for all field users', () => {
    expect(
      resolveLenderWalletUserId(
        user('u1', UserRole.USER),
        'owner-1',
        BorrowerAudience.ALL_FIELD_USERS,
      ),
    ).toBe('u1');
  });

  it('debits the admin actor when actor is ADMIN', () => {
    expect(
      resolveLenderWalletUserId(user('a1', UserRole.ADMIN), 'owner-1'),
    ).toBe('a1');
  });

  it('debits the super admin actor when actor is SUPER_ADMIN', () => {
    expect(
      resolveLenderWalletUserId(user('s1', UserRole.SUPER_ADMIN), 'owner-1'),
    ).toBe('s1');
  });
});
