'use client';

import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';

const LOAN = gql`
  query Loan($id: String!) {
    loan(id: $id) {
      id
      borrowerId
      principalAmount
      interestRate
      interestType
      interestAmount
      totalAmount
      termMonths
      startDate
      endDate
      monthlyInstallment
      status
      totalPaid
      outstandingAmount
    }
  }
`;

const REPS = gql`
  query RepaymentsForLoan($loanId: String!) {
    repaymentsForLoan(loanId: $loanId) {
      id
      amount
      paymentDate
      method
    }
  }
`;

const ADD_REP = gql`
  mutation AddRepayment($input: AddRepaymentInput!) {
    addRepayment(input: $input) {
      id
    }
  }
`;

export default function LoanDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data, loading, refetch } = useQuery<{
    loan: {
      id: string;
      borrowerId: string;
      principalAmount: number;
      interestRate: number;
      interestType: string;
      interestAmount: number;
      totalAmount: number;
      termMonths: number;
      startDate: string;
      endDate: string;
      monthlyInstallment: number;
      status: string;
      totalPaid: number;
      outstandingAmount: number;
    };
  }>(LOAN, { variables: { id } });
  const { data: repData, refetch: refetchReps } = useQuery<{
    repaymentsForLoan: {
      id: string;
      amount: number;
      paymentDate: string;
      method: string;
    }[];
  }>(REPS, {
    variables: { loanId: id },
  });
  const [addRep, { loading: adding }] = useMutation<{
    addRepayment: { id: string };
  }>(ADD_REP);

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('CASH');

  const loan = data?.loan;

  async function onRepay(e: React.FormEvent) {
    e.preventDefault();
    await addRep({
      variables: {
        input: {
          loanId: id,
          amount: parseFloat(amount),
          method,
        },
      },
    });
    setAmount('');
    refetch();
    refetchReps();
  }

  if (loading || !loan) {
    return <p className="text-zinc-500">Loading…</p>;
  }

  return (
    <div className="space-y-8">
      <Link href="/loans" className="text-sm text-blue-600">
        ← Loans
      </Link>
      <div>
        <h1 className="text-2xl font-semibold">Loan</h1>
        <p className="font-mono text-xs text-zinc-500">{loan.id}</p>
      </div>
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-zinc-500">Status</dt>
          <dd className="font-medium">{loan.status}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Principal</dt>
          <dd>{Number(loan.principalAmount).toFixed(2)}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Interest (flat)</dt>
          <dd>{Number(loan.interestAmount).toFixed(2)}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Total repayable</dt>
          <dd>{Number(loan.totalAmount).toFixed(2)}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Outstanding</dt>
          <dd>{Number(loan.outstandingAmount).toFixed(2)}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Collected</dt>
          <dd>{Number(loan.totalPaid).toFixed(2)}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Monthly installment</dt>
          <dd>{Number(loan.monthlyInstallment).toFixed(2)}</dd>
        </div>
      </dl>

      <section>
        <h2 className="text-lg font-medium">Record repayment</h2>
        <form onSubmit={onRepay} className="mt-2 flex flex-wrap gap-2">
          <input
            type="number"
            step="0.01"
            required
            placeholder="Amount"
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <select
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            <option value="CASH">CASH</option>
            <option value="BANK_TRANSFER">BANK_TRANSFER</option>
            <option value="MOBILE_MONEY">MOBILE_MONEY</option>
            <option value="OTHER">OTHER</option>
          </select>
          <button
            type="submit"
            disabled={adding}
            className="rounded bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            {adding ? 'Saving…' : 'Add repayment'}
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-medium">Repayments</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {(repData?.repaymentsForLoan ?? []).map(
            (r: { id: string; amount: number; paymentDate: string; method: string }) => (
              <li key={r.id} className="flex justify-between border-b border-zinc-100 py-1 dark:border-zinc-800">
                <span>{new Date(r.paymentDate).toLocaleDateString()}</span>
                <span className="tabular-nums">{Number(r.amount).toFixed(2)}</span>
                <span className="text-zinc-500">{r.method}</span>
              </li>
            ),
          )}
        </ul>
      </section>
    </div>
  );
}
