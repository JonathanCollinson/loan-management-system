'use client';

import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { useEffect, useState } from 'react';
import { updateSystemConfigInputSchema } from '@lms/validation';
import { formatZodError } from '@/lib/zod-form';

const ME = gql`
  query MeSettings {
    me {
      role
    }
  }
`;

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
  const { data: meData } = useQuery<{ me: { role: string } }>(ME);
  const role = meData?.me?.role;
  const canEdit = role === 'SUPER_ADMIN';

  const { data, loading, refetch } = useQuery<{
    systemConfig: { defaultInterestRate: number };
  }>(Q);
  const [update, { loading: saving }] = useMutation(M);
  const [rate, setRate] = useState('10');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (data?.systemConfig?.defaultInterestRate != null) {
      setRate(String(data.systemConfig.defaultInterestRate));
    }
  }, [data]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!canEdit) return;
    const parsed = updateSystemConfigInputSchema.safeParse({
      defaultInterestRate: parseFloat(rate),
    });
    if (!parsed.success) {
      setFormError(formatZodError(parsed.error));
      return;
    }
    await update({
      variables: { input: parsed.data },
    });
    refetch();
  }

  if (loading) return <p className="text-zinc-500">Loading…</p>;

  const displayRate = data?.systemConfig?.defaultInterestRate;

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold">System settings</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Default flat interest rate (percent) for new loans. Only Super Admin can
        change this value.
      </p>
      {canEdit ? (
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
          {formError && (
            <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </form>
      ) : (
        <div className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Default interest rate (%)
          </p>
          <p className="rounded border border-zinc-200 bg-zinc-50 px-3 py-2 tabular-nums text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
            {displayRate != null ? `${Number(displayRate).toFixed(2)}%` : '—'}
          </p>
          <p className="text-xs text-zinc-500">
            Contact a Super Admin to update this rate.
          </p>
        </div>
      )}
    </div>
  );
}
