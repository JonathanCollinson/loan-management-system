'use client';

import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const ME = gql`
  query MeNewLoan {
    me {
      role
      walletBalance
    }
  }
`;

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
  const { data: cfg } = useQuery<{
    systemConfig: { defaultInterestRate: number };
  }>(CFG);
  const [borrowerId, setBorrowerId] = useState('');
  const [principalAmount, setPrincipalAmount] = useState('1000');
  const [interestRate, setInterestRate] = useState('10');
  const [termMonths, setTermMonths] = useState('3');
  const [create, { loading }] = useMutation<{ createLoan: { id: string } }>(M);

  useEffect(() => {
    if (cfg?.systemConfig?.defaultInterestRate != null) {
      setInterestRate(String(cfg.systemConfig.defaultInterestRate));
    }
  }, [cfg]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const rate = parseFloat(interestRate);
    const res = await create({
      variables: {
        input: {
          borrowerId,
          principalAmount: parseFloat(principalAmount),
          ...(Number.isFinite(rate) ? { interestRate: rate } : {}),
          interestType: 'FLAT',
          termMonths: parseInt(termMonths, 10),
        },
      },
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
          Borrower ID
          <input
            required
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-900"
            value={borrowerId}
            onChange={(e) => setBorrowerId(e.target.value)}
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
        </label>
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
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-zinc-900 py-2 text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          {loading ? 'Creating…' : 'Create loan'}
        </button>
      </form>
    </div>
  );
}
