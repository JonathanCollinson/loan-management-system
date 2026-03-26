import { gql } from '@apollo/client';
import { MockedProvider } from '@apollo/client/testing/react';
import { render, screen } from '@testing-library/react';
import { AppShell } from '@/components/app-shell';

const ME = gql`
  query Me {
    me {
      id
      email
      name
      role
      walletBalance
    }
  }
`;

jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

jest.mock('@/lib/auth-storage', () => ({
  clearToken: jest.fn(),
}));

describe('AppShell', () => {
  function renderWithMe(role: string) {
    const mocks = [
      {
        request: { query: ME },
        result: {
          data: {
            me: {
              id: '507f1f77bcf86cd799439011',
              email: 'u@test.com',
              name: 'Test User',
              role,
              walletBalance: 100,
            },
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <AppShell>
          <div>Child</div>
        </AppShell>
      </MockedProvider>,
    );
  }

  it('shows core nav for a field user', async () => {
    renderWithMe('USER');
    expect(await screen.findByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Borrowers' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Capital' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Users' })).not.toBeInTheDocument();
  });

  it('shows admin Users and Funding for ADMIN', async () => {
    renderWithMe('ADMIN');
    expect(await screen.findByRole('link', { name: 'Users' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Funding' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Capital' })).not.toBeInTheDocument();
  });

  it('shows Super Admin links for SUPER_ADMIN', async () => {
    renderWithMe('SUPER_ADMIN');
    expect(await screen.findByRole('link', { name: 'Capital' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Admins' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
  });
});
