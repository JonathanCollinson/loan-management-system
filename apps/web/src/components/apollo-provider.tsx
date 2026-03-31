'use client';

import { ApolloProvider } from '@apollo/client/react';
import { useMemo } from 'react';
import { createApolloClient } from '@/lib/apollo-client';

export function ApolloProviderWrapper({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const client = useMemo(() => createApolloClient(), []);
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
