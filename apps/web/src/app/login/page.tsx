'use client';

import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { setToken } from '@/lib/auth-storage';

const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      user {
        id
        email
        name
        role
      }
    }
  }
`;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [login, { loading }] = useMutation<{
    login: {
      accessToken: string;
      user: { id: string; email: string; name: string; role: string };
    };
  }>(LOGIN);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await login({
        variables: { input: { email, password } },
      });
      const token = res.data?.login?.accessToken;
      if (!token) throw new Error('No token');
      setToken(token);
      router.replace('/dashboard');
    } catch {
      setError('Invalid email or password');
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Sign in
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Loan Management System
        </p>
        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3">
          <label className="text-sm text-zinc-700 dark:text-zinc-300">
            Email
            <input
              type="email"
              required
              autoComplete="email"
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="text-sm text-zinc-700 dark:text-zinc-300">
            Password
            <input
              type="password"
              required
              autoComplete="current-password"
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
