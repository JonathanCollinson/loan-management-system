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

const FUNDS = gql`
  query ActiveFundsForLoan {
    activeCapitalFunds {
      id
      name
      balance
      policy {
        defaultFlatInterestRatePercent
        defaultTermMonths
        minPrincipal
        maxPrincipal
      }
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
  query SystemConfigNewLoan {
    systemConfig {
      defaultInterestRate
      defaultTermMonths
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
  const { data: borrowersData } = useQuery<{
    borrowers: {
      id: string;
      name: string;
      phone?: string | null;
      address: string;
      audience: Audience;
    }[];
  }>(BORROWERS);
  const { data: fundsData } = useQuery<{
    activeCapitalFunds: {
      id: string;
      name: string;
      balance: number;
      policy: {
        defaultFlatInterestRatePercent?: number | null;
        defaultTermMonths?: number | null;
        minPrincipal?: number | null;
        maxPrincipal?: number | null;
      };
    }[];
  }>(FUNDS);
  const { data: cfg } = useQuery<{
    systemConfig: { defaultInterestRate: number; defaultTermMonths: number };
  }>(CFG);
  const [borrowerId, setBorrowerId] = useState('');
  const [principalFundId, setPrincipalFundId] = useState('');
  const [principalAmount, setPrincipalAmount] = useState('1000');
  const [interestRate, setInterestRate] = useState('10');
  const [termMonths, setTermMonths] = useState('1');
  const [create, { loading }] = useMutation<{ createLoan: { id: string } }>(M);
  const [formError, setFormError] = useState<string | null>(null);

  const canSetLoanRate = role === 'SUPER_ADMIN';
  const defaultRate = cfg?.systemConfig?.defaultInterestRate;
  const defaultTerm = cfg?.systemConfig?.defaultTermMonths ?? 1;

  const funds = useMemo(
    () => fundsData?.activeCapitalFunds ?? [],
    [fundsData?.activeCapitalFunds],
  );
  const selectedFund = useMemo(
    () => funds.find((f) => f.id === principalFundId),
    [funds, principalFundId],
  );

  const fundOptions = useMemo(
    () =>
      funds.map((f) => ({
        value: f.id,
        label: `${f.name} — balance ${Number(f.balance).toFixed(2)}`,
        searchText: `${f.name} ${f.id}`,
      })),
    [funds],
  );

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

  useEffect(() => {
    setTermMonths(String(defaultTerm));
  }, [defaultTerm]);

  useEffect(() => {
    if (funds.length && !principalFundId) {
      setPrincipalFundId(funds[0].id);
    }
  }, [funds, principalFundId]);

  useEffect(() => {
    if (!selectedFund) return;
    const p = selectedFund.policy;
    if (p?.defaultFlatInterestRatePercent != null && !canSetLoanRate) {
      setInterestRate(String(p.defaultFlatInterestRatePercent));
    }
    if (p?.defaultTermMonths != null) {
      setTermMonths(String(p.defaultTermMonths));
    }
  }, [selectedFund, canSetLoanRate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!borrowerId || !principalFundId) return;
    const rate = parseFloat(interestRate);
    const raw = {
      borrowerId,
      principalFundId,
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

  const policyHint = selectedFund?.policy;

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-semibold">New loan</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Principal is drawn from the selected <strong>capital fund</strong>. Ensure
        the fund has sufficient balance (admins can deposit under Admin → Funds).
      </p>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <label className="text-sm">
          Capital fund
          <SearchableSelect
            id="loan-fund"
            aria-label="Capital fund"
            value={principalFundId}
            onChange={setPrincipalFundId}
            options={fundOptions}
            emptyLabel="Search funds…"
          />
        </label>
        {selectedFund && (
          <div className="rounded border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            <p className="font-medium">Fund policy hints</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5">
              {policyHint?.defaultFlatInterestRatePercent != null && (
                <li>
                  Default rate: {policyHint.defaultFlatInterestRatePercent}%
                </li>
              )}
              {policyHint?.defaultTermMonths != null && (
                <li>Default term: {policyHint.defaultTermMonths} mo</li>
              )}
              {policyHint?.minPrincipal != null && (
                <li>Min principal: {policyHint.minPrincipal}</li>
              )}
              {policyHint?.maxPrincipal != null && (
                <li>Max principal: {policyHint.maxPrincipal}</li>
              )}
              {!policyHint?.defaultFlatInterestRatePercent &&
                !policyHint?.defaultTermMonths &&
                policyHint?.minPrincipal == null &&
                policyHint?.maxPrincipal == null && (
                  <li>No extra constraints (uses system defaults).</li>
                )}
            </ul>
          </div>
        )}
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
              placeholder="Uses fund or system default if empty"
            />
            <span className="mt-1 block text-xs text-zinc-500">
              Optional override; leave empty to use the fund or system default.
            </span>
          </label>
        ) : (
          <div className="text-sm">
            <p className="font-medium text-zinc-700 dark:text-zinc-300">
              Interest rate (% flat)
            </p>
            <p className="mt-1 rounded border border-zinc-200 bg-zinc-50 px-3 py-2 tabular-nums text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
              {selectedFund?.policy?.defaultFlatInterestRatePercent != null
                ? `${Number(selectedFund.policy.defaultFlatInterestRatePercent).toFixed(2)}%`
                : defaultRate != null
                  ? `${Number(defaultRate).toFixed(2)}%`
                  : '…'}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Set per fund or system-wide under Settings. You cannot change it
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
          disabled={loading || !borrowerId || !principalFundId}
          className="rounded bg-zinc-900 py-2 text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          {loading ? 'Creating…' : 'Create loan'}
        </button>
      </form>
    </div>
  );
}
