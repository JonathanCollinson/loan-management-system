'use client';

import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { createLoanInputSchema } from '@lms/validation';
import { SearchableSelect } from '@/components/searchable-select';
import { formatZodError } from '@/lib/zod-form';

const ME = gql`
  query MeNewLoan {
    me {
      role
      walletBalance
    }
  }
`;

const BORROWERS = gql`
  query BorrowersForLoan {
    borrowers {
      id
      name
      phone
      address
      audience
    }
  }
`;

type Audience = 'OWNER_ONLY' | 'ALL_FIELD_USERS' | 'ADMINS_ONLY';

function audienceShort(a: Audience): string {
  switch (a) {
    case 'ALL_FIELD_USERS':
      return 'Everyone';
    case 'ADMINS_ONLY':
      return 'Admins only';
    default:
      return 'Owner';
  }
}

const CFG = gql`
  query SystemConfig {
    systemConfig {
      defaultInterestRate
    }
  }
`;

const M = gql`
  mutation CreateLoan($input: CreateLoanInput!) {
    createLoan(input: $input) {
      id
    }
  }
`;

export default function NewLoanPage() {
  const router = useRouter();
  const { data: meData } = useQuery<{
    me: { role: string; walletBalance: number };
  }>(ME);
  const role = meData?.me?.role;
  const wallet = meData?.me?.walletBalance;
  const { data: borrowersData } = useQuery<{
    borrowers: {
      id: string;
      name: string;
      phone?: string | null;
      address: string;
      audience: Audience;
    }[];
  }>(BORROWERS);
  const { data: cfg } = useQuery<{
    systemConfig: { defaultInterestRate: number };
  }>(CFG);
  const [borrowerId, setBorrowerId] = useState('');
  const [principalAmount, setPrincipalAmount] = useState('1000');
  const [interestRate, setInterestRate] = useState('10');
  const [termMonths, setTermMonths] = useState('3');
  const [create, { loading }] = useMutation<{ createLoan: { id: string } }>(M);
  const [formError, setFormError] = useState<string | null>(null);

  const canSetLoanRate = role === 'SUPER_ADMIN';
  const defaultRate = cfg?.systemConfig?.defaultInterestRate;

  const borrowerOptions = useMemo(
    () =>
      (borrowersData?.borrowers ?? []).map((b) => ({
        value: b.id,
        label: `${b.name} — ${b.address || 'No address'} (${audienceShort(b.audience)})`,
        searchText: `${b.name} ${b.address ?? ''} ${b.phone ?? ''} ${b.id}`,
      })),
    [borrowersData],
  );

  useEffect(() => {
    if (defaultRate != null) {
      setInterestRate(String(defaultRate));
    }
  }, [defaultRate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!borrowerId) return;
    const rate = parseFloat(interestRate);
    const raw = {
      borrowerId,
      principalAmount: parseFloat(principalAmount),
      ...(canSetLoanRate && Number.isFinite(rate)
        ? { interestRate: rate }
        : {}),
      interestType: 'FLAT' as const,
      termMonths: parseInt(termMonths, 10),
    };
    const parsed = createLoanInputSchema.safeParse(raw);
    if (!parsed.success) {
      setFormError(formatZodError(parsed.error));
      return;
    }
    const res = await create({
      variables: { input: parsed.data },
    });
    const id = res.data?.createLoan?.id;
    if (id) router.replace(`/loans/${id}`);
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-semibold">New loan</h1>
      {role === 'USER' && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Principal is debited from <strong>your</strong> wallet (field user).
          Ask an admin to record funding to your user if you need more balance.
        </p>
      )}
      {(role === 'ADMIN' || role === 'SUPER_ADMIN') && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Principal is debited from <strong>your</strong> admin wallet. Use{' '}
          <strong>Funding</strong> to credit your user with lendable balance for
          the loan month. The borrower still belongs to their field user; only
          who supplies principal changes when you create the loan.
        </p>
      )}
      {(role === 'ADMIN' || role === 'SUPER_ADMIN') && wallet != null && (
        <p className="text-sm tabular-nums text-zinc-700 dark:text-zinc-300">
          Your wallet: {Number(wallet).toFixed(2)}
        </p>
      )}
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <label className="text-sm">
          Borrower
          <SearchableSelect
            id="loan-borrower"
            aria-label="Borrower"
            value={borrowerId}
            onChange={setBorrowerId}
            options={borrowerOptions}
            emptyLabel="Search borrowers by name or address…"
          />
        </label>
        <label className="text-sm">
          Principal
          <input
            type="number"
            step="0.01"
            required
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            value={principalAmount}
            onChange={(e) => setPrincipalAmount(e.target.value)}
          />
        </label>
        {canSetLoanRate ? (
          <label className="text-sm">
            Interest rate (% flat)
            <input
              type="number"
              step="0.01"
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              placeholder="Uses system default if empty"
            />
            <span className="mt-1 block text-xs text-zinc-500">
              Optional override for this loan; leave empty to use the system
              default from Settings.
            </span>
          </label>
        ) : (
          <div className="text-sm">
            <p className="font-medium text-zinc-700 dark:text-zinc-300">
              Interest rate (% flat)
            </p>
            <p className="mt-1 rounded border border-zinc-200 bg-zinc-50 px-3 py-2 tabular-nums text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
              {defaultRate != null
                ? `${Number(defaultRate).toFixed(2)}%`
                : '…'}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Set system-wide by Super Admin under Settings. You cannot change it
              here.
            </p>
          </div>
        )}
        <label className="text-sm">
          Term (months)
          <input
            type="number"
            required
            min={1}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            value={termMonths}
            onChange={(e) => setTermMonths(e.target.value)}
          />
        </label>
        {formError && (
          <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
        )}
        <button
          type="submit"
          disabled={loading || !borrowerId}
          className="rounded bg-zinc-900 py-2 text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          {loading ? 'Creating…' : 'Create loan'}
        </button>
      </form>
    </div>
  );
}
