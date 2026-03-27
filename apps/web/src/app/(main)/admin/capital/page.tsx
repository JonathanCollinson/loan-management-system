'use client';

import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { useMemo, useState } from 'react';
import {
  increaseMonthlyPrincipalBudgetInputSchema,
  setMonthlyPrincipalBudgetInputSchema,
} from '@lms/validation';
import { formatZodError } from '@/lib/zod-form';

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

const SET = gql`
  mutation SetMonthlyPrincipalBudget($input: SetMonthlyPrincipalBudgetInput!) {
    setMonthlyPrincipalBudget(input: $input) {
      month
      totalPrincipal
      events {
        id
        delta
        previousTotal
        newTotal
        actorUserId
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

const INCREASE = gql`
  mutation IncreaseMonthlyPrincipalBudget(
    $input: IncreaseMonthlyPrincipalBudgetInput!
  ) {
    increaseMonthlyPrincipalBudget(input: $input) {
      month
      totalPrincipal
      events {
        id
        delta
        previousTotal
        newTotal
        actorUserId
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

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const fmt = (n: number) =>
  n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function CapitalPage() {
  const [month, setMonth] = useState(currentMonth);
  const [setTotal, setSetTotal] = useState('');
  const [setNote, setSetNote] = useState('');
  const [incDelta, setIncDelta] = useState('');
  const [incNote, setIncNote] = useState('');
  const [budgetFormError, setBudgetFormError] = useState<string | null>(null);
  const [incFormError, setIncFormError] = useState<string | null>(null);

  const { data, loading, refetch } = useQuery<{
    monthlyPrincipalBudget: {
      month: string;
      totalPrincipal: number;
      note?: string | null;
      budgetCreatedAt?: string | null;
      budgetUpdatedAt?: string | null;
      events: {
        id: string;
        delta: number;
        previousTotal: number;
        newTotal: number;
        actorUserId: string;
        note?: string | null;
        createdAt: string;
      }[];
      utilization: {
        allocatedTotal: number;
        principalLoanedTotal: number;
        remainingVsLoans: number;
        remainingVsAllocations: number;
      };
    };
  }>(BUDGET, { variables: { month } });

  const [doSet, { loading: setting }] = useMutation(SET);
  const [doIncrease, { loading: increasing }] = useMutation(INCREASE);

  const detail = data?.monthlyPrincipalBudget;
  const util = detail?.utilization;

  const eventsDesc = useMemo(
    () => [...(detail?.events ?? [])].reverse(),
    [detail?.events],
  );

  async function onSet(e: React.FormEvent) {
    e.preventDefault();
    setBudgetFormError(null);
    const raw = {
      month,
      totalPrincipal: parseFloat(setTotal),
      note: setNote || undefined,
    };
    const parsed = setMonthlyPrincipalBudgetInputSchema.safeParse(raw);
    if (!parsed.success) {
      setBudgetFormError(formatZodError(parsed.error));
      return;
    }
    await doSet({
      variables: { input: parsed.data },
    });
    setSetTotal('');
    setSetNote('');
    refetch();
  }

  async function onIncrease(e: React.FormEvent) {
    e.preventDefault();
    setIncFormError(null);
    const raw = {
      month,
      delta: parseFloat(incDelta),
      note: incNote || undefined,
    };
    const parsed = increaseMonthlyPrincipalBudgetInputSchema.safeParse(raw);
    if (!parsed.success) {
      setIncFormError(formatZodError(parsed.error));
      return;
    }
    await doIncrease({
      variables: { input: parsed.data },
    });
    setIncDelta('');
    setIncNote('');
    refetch();
  }

  if (loading && !data) return <p className="text-zinc-500">Loading…</p>;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold">Monthly principal (CEO capital)</h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Set the total principal ceiling for a calendar month (YYYY-MM). You can
          replace the total or add more at any time; every change is recorded with a
          timestamp and actor. Field users and admins receive lendable balance via
          Funding; loans debit the lender&apos;s wallet.
        </p>
      </div>

      <label className="inline-flex flex-col gap-1 text-sm">
        Month
        <input
          type="month"
          className="w-48 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-600 dark:bg-zinc-900"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
      </label>

      {util && (
        <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="font-medium">Utilization vs budget</h2>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-zinc-500">Budget (ceiling)</dt>
              <dd className="tabular-nums font-medium">
                {fmt(detail?.totalPrincipal ?? 0)}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Funding allocated (month)</dt>
              <dd className="tabular-nums">{fmt(util.allocatedTotal)}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Principal loaned (month)</dt>
              <dd className="tabular-nums">{fmt(util.principalLoanedTotal)}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Remaining vs loans</dt>
              <dd className="tabular-nums">{fmt(util.remainingVsLoans)}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Remaining vs allocations</dt>
              <dd className="tabular-nums">{fmt(util.remainingVsAllocations)}</dd>
            </div>
          </dl>
          {(detail?.budgetCreatedAt || detail?.budgetUpdatedAt) && (
            <p className="mt-3 text-xs text-zinc-500">
              Budget row: created{' '}
              {detail.budgetCreatedAt
                ? new Date(detail.budgetCreatedAt).toLocaleString()
                : '—'}
              {detail.budgetUpdatedAt && (
                <>
                  {' '}
                  · updated{' '}
                  {new Date(detail.budgetUpdatedAt).toLocaleString()}
                </>
              )}
            </p>
          )}
        </section>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <form
          onSubmit={onSet}
          className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <h2 className="font-medium">Set / replace total</h2>
          <label className="block text-sm">
            Total principal for {month}
            <input
              required
              type="number"
              min={0}
              step="0.01"
              className="mt-1 w-full rounded border px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              value={setTotal}
              onChange={(e) => setSetTotal(e.target.value)}
              placeholder="e.g. 500000"
            />
          </label>
          <label className="block text-sm">
            Note (optional)
            <input
              className="mt-1 w-full rounded border px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              value={setNote}
              onChange={(e) => setSetNote(e.target.value)}
            />
          </label>
          {budgetFormError && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {budgetFormError}
            </p>
          )}
          <button
            type="submit"
            disabled={setting}
            className="rounded bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            {setting ? 'Saving…' : 'Set budget'}
          </button>
        </form>

        <form
          onSubmit={onIncrease}
          className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <h2 className="font-medium">Increase (add CEO capital)</h2>
          <p className="text-xs text-zinc-500">
            Adds to the current total for this month at any time.
          </p>
          <label className="block text-sm">
            Delta
            <input
              required
              type="number"
              min={0.01}
              step="0.01"
              className="mt-1 w-full rounded border px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              value={incDelta}
              onChange={(e) => setIncDelta(e.target.value)}
              placeholder="e.g. 50000"
            />
          </label>
          <label className="block text-sm">
            Note (optional)
            <input
              className="mt-1 w-full rounded border px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              value={incNote}
              onChange={(e) => setIncNote(e.target.value)}
            />
          </label>
          {incFormError && (
            <p className="text-sm text-red-600 dark:text-red-400">{incFormError}</p>
          )}
          <button
            type="submit"
            disabled={increasing}
            className="rounded bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            {increasing ? 'Saving…' : 'Increase budget'}
          </button>
        </form>
      </div>

      <section className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <h2 className="border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium dark:border-zinc-800 dark:bg-zinc-900">
          Change history (newest first)
        </h2>
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr>
              <th className="px-3 py-2">When</th>
              <th className="px-3 py-2">Actor</th>
              <th className="px-3 py-2">Delta</th>
              <th className="px-3 py-2">From → To</th>
              <th className="px-3 py-2">Note</th>
            </tr>
          </thead>
          <tbody>
            {eventsDesc.map((ev) => (
              <tr
                key={ev.id}
                className="border-t border-zinc-100 dark:border-zinc-800"
              >
                <td className="px-3 py-2 whitespace-nowrap">
                  {new Date(ev.createdAt).toLocaleString()}
                </td>
                <td className="px-3 py-2 font-mono text-xs">{ev.actorUserId}</td>
                <td className="px-3 py-2 tabular-nums">{fmt(ev.delta)}</td>
                <td className="px-3 py-2 tabular-nums text-xs">
                  {fmt(ev.previousTotal)} → {fmt(ev.newTotal)}
                </td>
                <td className="px-3 py-2">{ev.note ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {eventsDesc.length === 0 && (
          <p className="px-3 py-4 text-sm text-zinc-500">No changes yet for this month.</p>
        )}
      </section>
    </div>
  );
}
