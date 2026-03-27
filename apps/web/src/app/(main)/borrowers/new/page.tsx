'use client';

import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { createBorrowerInputSchema } from '@lms/validation';
import { SearchableSelect } from '@/components/searchable-select';
import { formatZodError } from '@/lib/zod-form';

const CREATE = gql`
  mutation CreateBorrower($input: CreateBorrowerInput!) {
    createBorrower(input: $input) {
      id
    }
  }
`;

const ME = gql`
  query Me {
    me {
      role
    }
  }
`;

const FIELD_USERS = gql`
  query FieldUsersForBorrower {
    listFieldUsers {
      id
      name
      email
    }
  }
`;

type BorrowerAudience = 'OWNER_ONLY' | 'ALL_FIELD_USERS' | 'ADMINS_ONLY';

export default function NewBorrowerPage() {
  const router = useRouter();
  const { data: meData } = useQuery<{ me: { role: string } }>(ME);
  const role = meData?.me?.role as string | undefined;

  const { data: usersData } = useQuery<{
    listFieldUsers: { id: string; name: string; email: string }[];
  }>(FIELD_USERS, { skip: role !== 'ADMIN' && role !== 'SUPER_ADMIN' });

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [ownerUserId, setOwnerUserId] = useState('');
  const [audience, setAudience] = useState<BorrowerAudience>('OWNER_ONLY');
  const [create, { loading }] = useMutation<{
    createBorrower: { id: string };
  }>(CREATE);
  const [formError, setFormError] = useState<string | null>(null);

  const ownerOptions = useMemo(
    () =>
      (usersData?.listFieldUsers ?? []).map((u) => ({
        value: u.id,
        label: `${u.name} (${u.email})`,
        searchText: `${u.name} ${u.email} ${u.id}`,
      })),
    [usersData],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const input: Record<string, string | undefined> = {
      name,
      address,
      phone: phone || undefined,
    };
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      input.ownerUserId = ownerUserId;
      input.audience = audience;
    }
    const parsed = createBorrowerInputSchema.safeParse(input);
    if (!parsed.success) {
      setFormError(formatZodError(parsed.error));
      return;
    }
    const res = await create({ variables: { input: parsed.data } });
    const id = res.data?.createBorrower?.id;
    if (id) router.replace(`/borrowers/${id}`);
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-semibold">New borrower</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <Field label="Name" value={name} onChange={setName} required />
        <Field label="Phone" value={phone} onChange={setPhone} />
        <label className="text-sm">
          <span className="text-zinc-700 dark:text-zinc-300">Address</span>
          <textarea
            required
            rows={3}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </label>
        {(role === 'ADMIN' || role === 'SUPER_ADMIN') && (
          <>
            <div className="text-sm">
              <span className="text-zinc-700 dark:text-zinc-300">
                Belongs to (field user)
              </span>
              <SearchableSelect
                id="borrower-owner"
                aria-label="Field user owner"
                value={ownerUserId}
                onChange={setOwnerUserId}
                options={ownerOptions}
                emptyLabel="Search field users by name or email…"
              />
              <p className="mt-1 text-xs text-zinc-500">
                Principal contact / owner for this borrower record.
              </p>
            </div>
            <fieldset className="space-y-2 text-sm">
              <legend className="font-medium text-zinc-700 dark:text-zinc-300">
                Visible to
              </legend>
              <label className="flex cursor-pointer items-start gap-2">
                <input
                  type="radio"
                  name="audience"
                  className="mt-1"
                  checked={audience === 'OWNER_ONLY'}
                  onChange={() => setAudience('OWNER_ONLY')}
                />
                <span>
                  <span className="font-medium">Owner only</span>
                  <span className="block text-xs text-zinc-500">
                    Only the selected field user sees and manages this borrower.
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-2">
                <input
                  type="radio"
                  name="audience"
                  className="mt-1"
                  checked={audience === 'ALL_FIELD_USERS'}
                  onChange={() => setAudience('ALL_FIELD_USERS')}
                />
                <span>
                  <span className="font-medium">Everyone (all field users)</span>
                  <span className="block text-xs text-zinc-500">
                    All field users can see this borrower; any of them can
                    originate loans (their wallet).
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-2">
                <input
                  type="radio"
                  name="audience"
                  className="mt-1"
                  checked={audience === 'ADMINS_ONLY'}
                  onChange={() => setAudience('ADMINS_ONLY')}
                />
                <span>
                  <span className="font-medium">Admins only</span>
                  <span className="block text-xs text-zinc-500">
                    Field users cannot see or use this borrower; admins manage it.
                  </span>
                </span>
              </label>
            </fieldset>
          </>
        )}
        {formError && (
          <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
        )}
        <button
          type="submit"
          disabled={
            loading ||
            ((role === 'ADMIN' || role === 'SUPER_ADMIN') && !ownerUserId)
          }
          className="rounded bg-zinc-900 py-2 text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          {loading ? 'Saving…' : 'Create'}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  type = 'text',
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  hint?: string;
}) {
  return (
    <label className="text-sm">
      <span className="text-zinc-700 dark:text-zinc-300">{label}</span>
      <input
        type={type}
        required={required}
        className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </label>
  );
}
