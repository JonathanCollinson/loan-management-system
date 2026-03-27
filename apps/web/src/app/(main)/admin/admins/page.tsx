'use client';

import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { useState } from 'react';
import { createAdminInputSchema } from '@lms/validation';
import { formatZodError } from '@/lib/zod-form';

const LIST = gql`
  query ListAdmins {
    listAdmins {
      id
      email
      name
      isActive
    }
  }
`;

const CREATE = gql`
  mutation CreateAdmin($input: CreateAdminInput!) {
    createAdmin(input: $input) {
      id
    }
  }
`;

export default function AdminsPage() {
  const { data, loading, refetch } = useQuery<{
    listAdmins: { id: string; name: string; email: string; isActive: boolean }[];
  }>(LIST);
  const [create, { loading: creating }] = useMutation(CREATE);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    const parsed = createAdminInputSchema.safeParse({
      email,
      password,
      name,
    });
    if (!parsed.success) {
      setCreateError(formatZodError(parsed.error));
      return;
    }
    await create({
      variables: { input: parsed.data },
    });
    setEmail('');
    setPassword('');
    setName('');
    refetch();
  }

  if (loading) return <p className="text-zinc-500">Loading…</p>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Administrators</h1>
      <form
        onSubmit={onCreate}
        className="max-w-md space-y-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <h2 className="font-medium">Create admin</h2>
        <input
          required
          placeholder="Name"
          className="w-full rounded border px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          required
          type="email"
          placeholder="Email"
          className="w-full rounded border px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          required
          type="password"
          minLength={8}
          placeholder="Password (min 8)"
          className="w-full rounded border px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {createError && (
          <p className="text-sm text-red-600 dark:text-red-400">{createError}</p>
        )}
        <button
          type="submit"
          disabled={creating}
          className="rounded bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          {creating ? 'Creating…' : 'Create admin'}
        </button>
      </form>
      <ul className="space-y-2 text-sm">
        {(data?.listAdmins ?? []).map(
          (a: { id: string; name: string; email: string; isActive: boolean }) => (
            <li
              key={a.id}
              className="flex justify-between rounded border border-zinc-200 px-3 py-2 dark:border-zinc-800"
            >
              <span>
                {a.name} ({a.email})
              </span>
              <span className="text-zinc-500">{a.isActive ? 'active' : 'inactive'}</span>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
