'use client';

import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import {
  addRepaymentInputSchema,
  rolloverLoanInputSchema,
  updateLoanInputSchema,
} from '@lms/validation';
import { formatZodError } from '@/lib/zod-form';

const ME = gql`
  query MeLoanDetail {
    me {
      role
    }
  }
`;

const LOAN = gql`
  query Loan($id: String!) {
    loan(id: $id) {
      id
      borrowerId
      principalFundId
      principalFundName
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
      rolloverCount
      currentPeriodEnd
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

const UPDATE_LOAN = gql`
  mutation UpdateLoan($input: UpdateLoanInput!) {
    updateLoan(input: $input) {
      id
      termMonths
      interestRate
      totalAmount
      outstandingAmount
      monthlyInstallment
      endDate
    }
  }
`;

const ROLLOVER = gql`
  mutation RolloverLoan($input: RolloverLoanInput!) {
    rolloverLoan(input: $input) {
      id
      termMonths
      endDate
      outstandingAmount
      totalAmount
      interestAmount
      rolloverCount
      monthlyInstallment
    }
  }
`;

export default function LoanDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: meData } = useQuery<{ me: { role: string } }>(ME);
  const role = meData?.me?.role;
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
  const isSuper = role === 'SUPER_ADMIN';

  const { data, loading, refetch } = useQuery<{
    loan: {
      id: string;
      borrowerId: string;
      principalFundId?: string | null;
      principalFundName?: string | null;
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
      rolloverCount: number;
      currentPeriodEnd?: string | null;
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
  const [updateLoan, { loading: updating }] = useMutation(UPDATE_LOAN);
  const [rolloverLoan, { loading: rolling }] = useMutation(ROLLOVER);

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('CASH');
  const [formError, setFormError] = useState<string | null>(null);
  const [editTerm, setEditTerm] = useState('');
  const [editRate, setEditRate] = useState('');
  const [editErr, setEditErr] = useState<string | null>(null);
  const [rollPct, setRollPct] = useState('');
  const [rollErr, setRollErr] = useState<string | null>(null);

  const loan = data?.loan;

  async function onRepay(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const raw = {
      loanId: id,
      amount: parseFloat(amount),
      method: method as 'CASH' | 'BANK_TRANSFER' | 'MOBILE_MONEY' | 'OTHER',
    };
    const parsed = addRepaymentInputSchema.safeParse(raw);
    if (!parsed.success) {
      setFormError(formatZodError(parsed.error));
      return;
    }
    await addRep({
      variables: { input: parsed.data },
    });
    setAmount('');
    refetch();
    refetchReps();
  }

  async function onUpdateLoan(e: React.FormEvent) {
    e.preventDefault();
    setEditErr(null);
    if (!loan) return;
    const raw: Record<string, unknown> = { loanId: id };
    if (editTerm.trim() !== '') {
      raw.termMonths = parseInt(editTerm, 10);
    }
    if (isSuper && editRate.trim() !== '') {
      raw.interestRate = parseFloat(editRate);
    }
    const parsed = updateLoanInputSchema.safeParse(raw);
    if (!parsed.success) {
      setEditErr(formatZodError(parsed.error));
      return;
    }
    await updateLoan({ variables: { input: parsed.data } });
    refetch();
  }

  async function onRollover(e: React.FormEvent) {
    e.preventDefault();
    setRollErr(null);
    const raw: { loanId: string; interestPercentOnOutstanding?: number } = {
      loanId: id,
    };
    if (rollPct.trim() !== '') {
      raw.interestPercentOnOutstanding = parseFloat(rollPct);
    }
    const parsed = rolloverLoanInputSchema.safeParse(raw);
    if (!parsed.success) {
      setRollErr(formatZodError(parsed.error));
      return;
    }
    await rolloverLoan({ variables: { input: parsed.data } });
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

      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm text-zinc-500">Total collected</p>
        <p className="text-3xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
          {Number(loan.totalPaid).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Outstanding:{' '}
          {Number(loan.outstandingAmount).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
      </div>

      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-zinc-500">Status</dt>
          <dd className="font-medium">{loan.status}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Capital fund</dt>
          <dd>
            {loan.principalFundName ?? '—'}
            {loan.principalFundId && (
              <span className="ml-1 font-mono text-xs text-zinc-400">
                ({loan.principalFundId.slice(-8)})
              </span>
            )}
          </dd>
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
          <dt className="text-zinc-500">Rollovers</dt>
          <dd>{loan.rolloverCount ?? 0}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Monthly installment</dt>
          <dd>{Number(loan.monthlyInstallment).toFixed(2)}</dd>
        </div>
      </dl>

      {isAdmin && loan.totalPaid === 0 && loan.status !== 'PAID' && (
        <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="text-lg font-medium">Adjust loan (before repayments)</h2>
          <form onSubmit={onUpdateLoan} className="mt-3 flex flex-wrap gap-2">
            <label className="text-sm">
              Term (months)
              <input
                type="number"
                min={1}
                className="ml-2 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
                placeholder={String(loan.termMonths)}
                value={editTerm}
                onChange={(e) => setEditTerm(e.target.value)}
              />
            </label>
            {isSuper && (
              <label className="text-sm">
                Interest rate (%)
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  className="ml-2 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
                  placeholder={String(loan.interestRate)}
                  value={editRate}
                  onChange={(e) => setEditRate(e.target.value)}
                />
              </label>
            )}
            {editErr && (
              <p className="w-full text-sm text-red-600">{editErr}</p>
            )}
            <button
              type="submit"
              disabled={updating}
              className="rounded bg-zinc-900 px-3 py-1 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              {updating ? 'Saving…' : 'Update'}
            </button>
          </form>
        </section>
      )}

      {loan.status !== 'PAID' && Number(loan.outstandingAmount) > 0 && (
        <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="text-lg font-medium">Rollover period</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Extends the end date by one month. Optional interest on outstanding
            uses the fund default if you leave the field empty. Manual-mode funds
            only allow admins to roll.
          </p>
          <form onSubmit={onRollover} className="mt-3 flex flex-wrap items-end gap-2">
            <label className="text-sm">
              Interest on outstanding (%)
              <input
                type="number"
                step="0.01"
                min={0}
                className="ml-2 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
                placeholder="optional"
                value={rollPct}
                onChange={(e) => setRollPct(e.target.value)}
              />
            </label>
            {rollErr && (
              <p className="w-full text-sm text-red-600">{rollErr}</p>
            )}
            <button
              type="submit"
              disabled={rolling}
              className="rounded bg-zinc-900 px-3 py-1 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              {rolling ? 'Rolling…' : 'Rollover'}
            </button>
          </form>
        </section>
      )}

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
          {formError && (
            <p className="w-full text-sm text-red-600 dark:text-red-400">
              {formError}
            </p>
          )}
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
            (r: {
              id: string;
              amount: number;
              paymentDate: string;
              method: string;
            }) => (
              <li
                key={r.id}
                className="flex justify-between border-b border-zinc-100 py-1 dark:border-zinc-800"
              >
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
