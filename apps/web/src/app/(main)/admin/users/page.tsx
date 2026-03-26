'use client';

import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { useState } from 'react';

const LIST = gql`
  query ListFieldUsers {
    listFieldUsers {
      id
      email
      name
      walletBalance
      isActive
    }
  }
`;

const CREATE = gql`
  mutation CreateFieldUser($input: CreateFieldUserInput!) {
    createFieldUser(input: $input) {
      id
    }
  }
`;

const UPDATE = gql`
  mutation UpdateUser($input: UpdateUserInput!) {
    updateUser(input: $input) {
      id
    }
  }
`;

export default function AdminUsersPage() {
  const { data, loading, refetch } = useQuery<{
    listFieldUsers: {
      id: string;
      name: string;
      email: string;
      walletBalance: number;
      isActive: boolean;
    }[];
  }>(LIST);
  const [create, { loading: creating }] = useMutation(CREATE);
  const [update] = useMutation(UPDATE);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    await create({
      variables: { input: { email, password, name } },
    });
    setEmail('');
    setPassword('');
    setName('');
    refetch();
  }

  if (loading) return <p className="text-zinc-500">Loading…</p>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Field users</h1>
      <form
        onSubmit={onCreate}
        className="max-w-md space-y-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <h2 className="font-medium">Create field user</h2>
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
        <button
          type="submit"
          disabled={creating}
          className="rounded bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          {creating ? 'Creating…' : 'Create'}
        </button>
      </form>
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Wallet</th>
              <th className="px-3 py-2">Active</th>
              <th className="px-3 py-2">ID</th>
            </tr>
          </thead>
          <tbody>
            {(data?.listFieldUsers ?? []).map(
              (u: {
                id: string;
                name: string;
                email: string;
                walletBalance: number;
                isActive: boolean;
              }) => (
                <tr key={u.id} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="px-3 py-2">{u.name}</td>
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2 tabular-nums">
                    {Number(u.walletBalance).toFixed(2)}
                  </td>
                  <td className="px-3 py-2">{u.isActive ? 'yes' : 'no'}</td>
                  <td className="px-3 py-2 font-mono text-xs">{u.id}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      className="text-sm text-blue-600"
                      onClick={async () => {
                        await update({
                          variables: {
                            input: {
                              userId: u.id,
                              isActive: !u.isActive,
                            },
                          },
                        });
                        refetch();
                      }}
                    >
                      Toggle
                    </button>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
