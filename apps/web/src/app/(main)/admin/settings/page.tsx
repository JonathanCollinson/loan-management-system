'use client';

import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { useEffect, useState } from 'react';

const Q = gql`
  query SystemConfig {
    systemConfig {
      defaultInterestRate
    }
  }
`;

const M = gql`
  mutation UpdateSystemConfig($input: UpdateSystemConfigInput!) {
    updateSystemConfig(input: $input) {
      defaultInterestRate
    }
  }
`;

export default function AdminSettingsPage() {
  const { data, loading, refetch } = useQuery<{
    systemConfig: { defaultInterestRate: number };
  }>(Q);
  const [update, { loading: saving }] = useMutation(M);
  const [rate, setRate] = useState('10');

  useEffect(() => {
    if (data?.systemConfig?.defaultInterestRate != null) {
      setRate(String(data.systemConfig.defaultInterestRate));
    }
  }, [data]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await update({
      variables: {
        input: { defaultInterestRate: parseFloat(rate) },
      },
    });
    refetch();
  }

  if (loading) return <p className="text-zinc-500">Loading…</p>;

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold">System settings</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Default flat interest rate (percent) applied when a new loan omits an
        explicit rate. Super Admin only.
      </p>
      <form
        onSubmit={onSubmit}
        className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <label className="block text-sm">
          Default interest rate (%)
          <input
            type="number"
            step="0.01"
            min={0}
            required
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </form>
    </div>
  );
}
