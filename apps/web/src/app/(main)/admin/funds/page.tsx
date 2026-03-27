'use client';

import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { useMemo, useState } from 'react';
import { formatZodError } from '@/lib/zod-form';
import { z } from 'zod';

const LIST = gql`
  query CapitalFundsList {
    capitalFunds {
      id
      name
      balance
      isActive
      policy {
        defaultFlatInterestRatePercent
        defaultTermMonths
        minPrincipal
        maxPrincipal
        rolloverMode
        rolloverInterestOnOutstandingPercent
      }
    }
  }
`;

const CREATE = gql`
  mutation CreateCapitalFund($input: CreateCapitalFundInput!) {
    createCapitalFund(input: $input) {
      id
      name
    }
  }
`;

const UPDATE = gql`
  mutation UpdateCapitalFund($input: UpdateCapitalFundInput!) {
    updateCapitalFund(input: $input) {
      id
      name
      balance
      isActive
      policy {
        defaultFlatInterestRatePercent
        defaultTermMonths
        minPrincipal
        maxPrincipal
        rolloverMode
        rolloverInterestOnOutstandingPercent
      }
    }
  }
`;

const DEPOSIT = gql`
  mutation DepositToCapitalFund($input: DepositToCapitalFundInput!) {
    depositToCapitalFund(input: $input) {
      id
      balance
    }
  }
`;

const ME = gql`
  query MeFundsAdmin {
    me {
      role
    }
  }
`;

const createSchema = z.object({
  name: z.string().min(1),
});

const depositSchema = z.object({
  fundId: z.string().min(1),
  amount: z.number().min(0.01),
  note: z.string().optional(),
});

export default function AdminFundsPage() {
  const { data: meData } = useQuery<{ me: { role: string } }>(ME);
  const role = meData?.me?.role;
  const canManage = role === 'SUPER_ADMIN';
  const canDeposit = role === 'ADMIN' || role === 'SUPER_ADMIN';

  const { data, loading, refetch } = useQuery<{
    capitalFunds: {
      id: string;
      name: string;
      balance: number;
      isActive: boolean;
      policy: {
        defaultFlatInterestRatePercent?: number | null;
        defaultTermMonths?: number | null;
        minPrincipal?: number | null;
        maxPrincipal?: number | null;
        rolloverMode?: string | null;
        rolloverInterestOnOutstandingPercent?: number | null;
      };
    }[];
  }>(LIST);

  const [createName, setCreateName] = useState('');
  const [createErr, setCreateErr] = useState<string | null>(null);
  const [doCreate, { loading: creating }] = useMutation(CREATE);

  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [defRate, setDefRate] = useState('');
  const [defTerm, setDefTerm] = useState('');
  const [minP, setMinP] = useState('');
  const [maxP, setMaxP] = useState('');
  const [rollMode, setRollMode] = useState<'AUTO' | 'MANUAL' | ''>('');
  const [rollIntPct, setRollIntPct] = useState('');
  const [editErr, setEditErr] = useState<string | null>(null);
  const [doUpdate, { loading: updating }] = useMutation(UPDATE);

  const [depFundId, setDepFundId] = useState('');
  const [depAmount, setDepAmount] = useState('');
  const [depNote, setDepNote] = useState('');
  const [depErr, setDepErr] = useState<string | null>(null);
  const [doDeposit, { loading: depositing }] = useMutation(DEPOSIT);

  const funds = useMemo(
    () => data?.capitalFunds ?? [],
    [data?.capitalFunds],
  );

  const fundOptions = useMemo(
    () =>
      funds.map((f) => ({
        value: f.id,
        label: `${f.name} (${Number(f.balance).toFixed(2)})`,
      })),
    [funds],
  );

  function openEdit(f: (typeof funds)[0]) {
    setEditId(f.id);
    setEditName(f.name);
    setEditActive(f.isActive);
    const p = f.policy ?? {};
    setDefRate(
      p.defaultFlatInterestRatePercent != null
        ? String(p.defaultFlatInterestRatePercent)
        : '',
    );
    setDefTerm(p.defaultTermMonths != null ? String(p.defaultTermMonths) : '');
    setMinP(p.minPrincipal != null ? String(p.minPrincipal) : '');
    setMaxP(p.maxPrincipal != null ? String(p.maxPrincipal) : '');
    setRollMode(
      p.rolloverMode === 'AUTO' || p.rolloverMode === 'MANUAL'
        ? p.rolloverMode
        : '',
    );
    setRollIntPct(
      p.rolloverInterestOnOutstandingPercent != null
        ? String(p.rolloverInterestOnOutstandingPercent)
        : '',
    );
    setEditErr(null);
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateErr(null);
    if (!canManage) return;
    const parsed = createSchema.safeParse({ name: createName.trim() });
    if (!parsed.success) {
      setCreateErr(formatZodError(parsed.error));
      return;
    }
    await doCreate({
      variables: { input: { name: parsed.data.name, policy: {} } },
    });
    setCreateName('');
    refetch();
  }

  async function onSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    setEditErr(null);
    if (!editId || !canManage) return;
    const policy: Record<string, unknown> = {};
    if (defRate.trim() !== '') {
      policy.defaultFlatInterestRatePercent = parseFloat(defRate);
    }
    if (defTerm.trim() !== '') {
      policy.defaultTermMonths = parseInt(defTerm, 10);
    }
    if (minP.trim() !== '') policy.minPrincipal = parseFloat(minP);
    if (maxP.trim() !== '') policy.maxPrincipal = parseFloat(maxP);
    if (rollMode) policy.rolloverMode = rollMode;
    if (rollIntPct.trim() !== '') {
      policy.rolloverInterestOnOutstandingPercent = parseFloat(rollIntPct);
    }
    await doUpdate({
      variables: {
        input: {
          fundId: editId,
          name: editName.trim(),
          isActive: editActive,
          policy,
        },
      },
    });
    setEditId(null);
    refetch();
  }

  async function onDeposit(e: React.FormEvent) {
    e.preventDefault();
    setDepErr(null);
    if (!canDeposit) return;
    const parsed = depositSchema.safeParse({
      fundId: depFundId,
      amount: parseFloat(depAmount),
      note: depNote.trim() || undefined,
    });
    if (!parsed.success) {
      setDepErr(formatZodError(parsed.error));
      return;
    }
    await doDeposit({ variables: { input: parsed.data } });
    setDepAmount('');
    setDepNote('');
    refetch();
  }

  if (loading && !data) return <p className="text-zinc-500">Loading…</p>;

  if (!canDeposit && !canManage) {
    return (
      <p className="text-zinc-600 dark:text-zinc-400">
        You do not have access to capital fund administration.
      </p>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold">Capital funds</h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Named pools hold lendable principal. Deposits increase the balance;
          new loans debit the selected fund. Policies set defaults for that
          pool (interest, term, rollover behaviour).
        </p>
      </div>

      <section className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Balance</th>
              <th className="px-3 py-2">Active</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {funds.map((f) => (
              <tr
                key={f.id}
                className="border-b border-zinc-100 dark:border-zinc-800"
              >
                <td className="px-3 py-2 font-medium">{f.name}</td>
                <td className="px-3 py-2 tabular-nums">
                  {Number(f.balance).toFixed(2)}
                </td>
                <td className="px-3 py-2">{f.isActive ? 'Yes' : 'No'}</td>
                <td className="px-3 py-2">
                  {canManage && (
                    <button
                      type="button"
                      className="text-blue-600 hover:underline"
                      onClick={() => openEdit(f)}
                    >
                      Edit policy
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {canManage && (
        <form
          onSubmit={onCreate}
          className="max-w-md space-y-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
        >
          <h2 className="font-medium">Create fund</h2>
          <label className="block text-sm">
            Name
            <input
              required
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
            />
          </label>
          {createErr && (
            <p className="text-sm text-red-600 dark:text-red-400">{createErr}</p>
          )}
          <button
            type="submit"
            disabled={creating}
            className="rounded bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            {creating ? 'Creating…' : 'Create'}
          </button>
        </form>
      )}

      {canDeposit && (
        <form
          onSubmit={onDeposit}
          className="max-w-md space-y-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
        >
          <h2 className="font-medium">Deposit to fund</h2>
          <label className="block text-sm">
            Fund
            <select
              required
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              value={depFundId}
              onChange={(e) => setDepFundId(e.target.value)}
            >
              <option value="">Select…</option>
              {fundOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Amount
            <input
              required
              type="number"
              min={0.01}
              step="0.01"
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              value={depAmount}
              onChange={(e) => setDepAmount(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Note (optional)
            <input
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              value={depNote}
              onChange={(e) => setDepNote(e.target.value)}
            />
          </label>
          {depErr && (
            <p className="text-sm text-red-600 dark:text-red-400">{depErr}</p>
          )}
          <button
            type="submit"
            disabled={depositing || !depFundId}
            className="rounded bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            {depositing ? 'Depositing…' : 'Deposit'}
          </button>
        </form>
      )}

      {editId && canManage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={onSaveEdit}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto space-y-3 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <h2 className="text-lg font-medium">Edit fund</h2>
            <label className="block text-sm">
              Name
              <input
                required
                className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editActive}
                onChange={(e) => setEditActive(e.target.checked)}
              />
              Active
            </label>
            <p className="text-xs font-medium text-zinc-500">Policy defaults</p>
            <label className="block text-sm">
              Default flat rate (%)
              <input
                type="number"
                step="0.01"
                className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                value={defRate}
                onChange={(e) => setDefRate(e.target.value)}
                placeholder="e.g. 10"
              />
            </label>
            <label className="block text-sm">
              Default term (months)
              <input
                type="number"
                min={1}
                className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                value={defTerm}
                onChange={(e) => setDefTerm(e.target.value)}
                placeholder="e.g. 1"
              />
            </label>
            <label className="block text-sm">
              Min principal
              <input
                type="number"
                step="0.01"
                className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                value={minP}
                onChange={(e) => setMinP(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              Max principal
              <input
                type="number"
                step="0.01"
                className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                value={maxP}
                onChange={(e) => setMaxP(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              Rollover mode
              <select
                className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                value={rollMode}
                onChange={(e) =>
                  setRollMode(e.target.value as 'AUTO' | 'MANUAL' | '')
                }
              >
                <option value="">(inherit global)</option>
                <option value="AUTO">AUTO (borrower may roll)</option>
                <option value="MANUAL">MANUAL (admin only)</option>
              </select>
            </label>
            <label className="block text-sm">
              Rollover interest on outstanding (%)
              <input
                type="number"
                step="0.01"
                min={0}
                className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                value={rollIntPct}
                onChange={(e) => setRollIntPct(e.target.value)}
                placeholder="optional"
              />
            </label>
            {editErr && (
              <p className="text-sm text-red-600 dark:text-red-400">{editErr}</p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={updating}
                className="rounded bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
              >
                {updating ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                className="rounded border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-600"
                onClick={() => setEditId(null)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
