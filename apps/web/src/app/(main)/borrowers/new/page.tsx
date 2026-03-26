'use client';

import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

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

export default function NewBorrowerPage() {
  const router = useRouter();
  const { data: meData } = useQuery<{ me: { role: string } }>(ME);
  const role = meData?.me?.role as string | undefined;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [idDocument, setIdDocument] = useState('');
  const [ownerUserId, setOwnerUserId] = useState('');
  const [create, { loading }] = useMutation<{
    createBorrower: { id: string };
  }>(CREATE);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input: Record<string, string | undefined> = {
      name,
      phone: phone || undefined,
      email: email || undefined,
      idDocument: idDocument || undefined,
    };
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      input.ownerUserId = ownerUserId;
    }
    const res = await create({ variables: { input } });
    const id = res.data?.createBorrower?.id;
    if (id) router.replace(`/borrowers/${id}`);
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-semibold">New borrower</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <Field label="Name" value={name} onChange={setName} required />
        <Field label="Phone" value={phone} onChange={setPhone} />
        <Field label="Email" value={email} onChange={setEmail} type="email" />
        <Field label="ID document" value={idDocument} onChange={setIdDocument} />
        {(role === 'ADMIN' || role === 'SUPER_ADMIN') && (
          <Field
            label="Field user ID (owner)"
            value={ownerUserId}
            onChange={setOwnerUserId}
            required
              hint="Mongo ObjectId of the USER who will own this borrower."
          />
        )}
        <button
          type="submit"
          disabled={loading}
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
