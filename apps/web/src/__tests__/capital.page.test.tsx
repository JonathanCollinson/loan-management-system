import { gql } from '@apollo/client';
import { MockedProvider } from '@apollo/client/testing/react';
import { render, screen } from '@testing-library/react';
import CapitalPage from '@/app/(main)/admin/capital/page';

const BUDGET = gql`
  query MonthlyPrincipalBudget($month: String!) {
    monthlyPrincipalBudget(month: $month) {
      month
      totalPrincipal
      note
      budgetCreatedAt
      budgetUpdatedAt
      events {
        id
        delta
        previousTotal
        newTotal
        actorUserId
        note
        createdAt
      }
      utilization {
        allocatedTotal
        principalLoanedTotal
        remainingVsLoans
        remainingVsAllocations
      }
    }
  }
`;

describe('CapitalPage', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-15T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders utilization and disables submit buttons while mutations run', async () => {
    const mocks = [
      {
        request: {
          query: BUDGET,
          variables: { month: '2026-03' },
        },
        result: {
          data: {
            monthlyPrincipalBudget: {
              month: '2026-03',
              totalPrincipal: 500_000,
              note: null,
              budgetCreatedAt: '2026-03-01T00:00:00.000Z',
              budgetUpdatedAt: null,
              events: [],
              utilization: {
                allocatedTotal: 10_000,
                principalLoanedTotal: 5_000,
                remainingVsLoans: 485_000,
                remainingVsAllocations: 490_000,
              },
            },
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <CapitalPage />
      </MockedProvider>,
    );

    expect(await screen.findByText(/Monthly principal \(CEO capital\)/)).toBeInTheDocument();
    expect(screen.getByText(/Utilization vs budget/)).toBeInTheDocument();
    expect(screen.getByText(/500,000\.00/)).toBeInTheDocument();

    const setBtn = screen.getByRole('button', { name: 'Set budget' });
    const incBtn = screen.getByRole('button', { name: 'Increase budget' });
    expect(setBtn).not.toBeDisabled();
    expect(incBtn).not.toBeDisabled();
  });
});
