'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { clearToken } from '@/lib/auth-storage';

const ME = gql`
  query Me {
    me {
      id
      email
      name
      role
      walletBalance
    }
  }
`;

const linkCls = (active: boolean) =>
  `rounded px-3 py-2 text-sm ${active ? 'bg-zinc-200 font-medium dark:bg-zinc-700' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data, loading } = useQuery<{
    me: {
      id: string;
      email: string;
      name: string;
      role: string;
      walletBalance: number;
    };
  }>(ME);

  const role = data?.me?.role as string | undefined;

  const nav = (
    <nav className="flex flex-wrap gap-1 border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
      <Link className={linkCls(pathname === '/dashboard')} href="/dashboard">
        Dashboard
      </Link>
      <Link
        className={linkCls(
          pathname === '/borrowers' ||
            (pathname?.startsWith('/borrowers/') &&
              pathname !== '/borrowers/summary'),
        )}
        href="/borrowers"
      >
        Borrowers
      </Link>
      <Link
        className={linkCls(pathname === '/borrowers/summary')}
        href="/borrowers/summary"
      >
        Summary
      </Link>
      <Link className={linkCls(pathname?.startsWith('/loans'))} href="/loans">
        Loans
      </Link>
      <Link className={linkCls(pathname?.startsWith('/reports'))} href="/reports">
        Reports
      </Link>
      {(role === 'ADMIN' || role === 'SUPER_ADMIN') && (
        <>
          <Link
            className={linkCls(pathname?.startsWith('/admin/users'))}
            href="/admin/users"
          >
            Users
          </Link>
          <Link
            className={linkCls(pathname?.startsWith('/admin/funding'))}
            href="/admin/funding"
          >
            Funding
          </Link>
        </>
      )}
      {role === 'SUPER_ADMIN' && (
        <>
          <Link
            className={linkCls(pathname?.startsWith('/admin/admins'))}
            href="/admin/admins"
          >
            Admins
          </Link>
          <Link
            className={linkCls(pathname?.startsWith('/admin/settings'))}
            href="/admin/settings"
          >
            Settings
          </Link>
        </>
      )}
      <div className="ml-auto flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
        {loading ? (
          '…'
        ) : (
          <>
            <span>
              {data?.me?.name} ({data?.me?.role})
            </span>
            {role === 'USER' && (
              <span className="tabular-nums">
                Wallet: {Number(data?.me?.walletBalance ?? 0).toFixed(2)}
              </span>
            )}
            <button
              type="button"
              className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-600"
              onClick={() => {
                clearToken();
                window.location.href = '/login';
              }}
            >
              Log out
            </button>
          </>
        )}
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {nav}
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
