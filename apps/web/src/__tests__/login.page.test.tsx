import { gql } from '@apollo/client';
import { MockedProvider } from '@apollo/client/testing/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '@/app/login/page';

const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      user {
        id
        email
        name
        role
      }
    }
  }
`;

const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace, push: jest.fn() }),
}));

const setTokenMock = jest.fn();

jest.mock('@/lib/auth-storage', () => ({
  setToken: (...args: unknown[]) => setTokenMock(...(args as [string])),
  getToken: () => null,
  clearToken: jest.fn(),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    setTokenMock.mockClear();
  });

  it('submits login mutation and stores token', async () => {
    const user = userEvent.setup();
    const mocks = [
      {
        request: {
          query: LOGIN,
          variables: {
            input: { email: 'field@example.com', password: 'password123' },
          },
        },
        result: {
          data: {
            login: {
              accessToken: 'jwt-token',
              user: {
                id: '507f1f77bcf86cd799439011',
                email: 'field@example.com',
                name: 'Field',
                role: 'USER',
              },
            },
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <LoginPage />
      </MockedProvider>,
    );

    await user.type(
      screen.getByRole('textbox', { name: /email/i }),
      'field@example.com',
    );
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(setTokenMock).toHaveBeenCalledWith('jwt-token');
      expect(mockReplace).toHaveBeenCalledWith('/dashboard');
    });
  });
});
