'use client';

import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { updateBorrowerInputSchema } from '@lms/validation';
import { formatZodError } from '@/lib/zod-form';

const Q = gql`
  query Borrower($id: String!) {
    borrower(id: $id) {
      id
      name
      phone
      address
      createdByUserId
      audience
    }
  }
`;

type Audience = 'OWNER_ONLY' | 'ALL_FIELD_USERS' | 'ADMINS_ONLY';

function audienceLabel(a: Audience): string {
  switch (a) {
    case 'ALL_FIELD_USERS':
      return 'Everyone (all field users)';
    case 'ADMINS_ONLY':
      return 'Admins only';
    default:
      return 'Owner only';
  }
}

const UPDATE = gql`
  mutation UpdateBorrower($input: UpdateBorrowerInput!) {
    updateBorrower(input: $input) {
      id
    }
  }
`;

export default function BorrowerDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data, loading, refetch } = useQuery<{
    borrower: {
      id: string;
      name: string;
      phone?: string | null;
      address: string;
      audience: Audience;
    };
  }>(Q, { variables: { id } });
  const [mutate] = useMutation(UPDATE);

  const b = data?.borrower;
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (b) {
      setName(b.name);
      setPhone(b.phone ?? '');
      setAddress(b.address ?? '');
    }
  }, [b]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const input = {
      borrowerId: id,
      name,
      phone: phone || undefined,
      address,
    };
    const parsed = updateBorrowerInputSchema.safeParse(input);
    if (!parsed.success) {
      setFormError(formatZodError(parsed.error));
      return;
    }
    await mutate({
      variables: { input: parsed.data },
    });
    refetch();
  }

  if (loading || !b) {
    return <p className="text-zinc-500">Loading…</p>;
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/borrowers" className="text-sm text-blue-600">
          ← Borrowers
        </Link>
      </div>
      <h1 className="text-2xl font-semibold">{b.name}</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Visible to:{' '}
        <span className="font-medium text-zinc-800 dark:text-zinc-200">
          {audienceLabel(b.audience)}
        </span>
      </p>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <label className="text-sm">
          Name
          <input
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="text-sm">
          Phone
          <input
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>
        <label className="text-sm">
          Address
          <textarea
            required
            rows={3}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </label>
        {formError && (
          <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
        )}
        <button
          type="submit"
          className="rounded bg-zinc-900 py-2 text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Save
        </button>
      </form>
    </div>
  );
}
