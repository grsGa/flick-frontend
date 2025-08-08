"use client";

import React from 'react';
import { AuthProvider } from '@/hooks/useAuth';
import { ApolloProvider } from '@apollo/client';
import client from '@/lib/apollo-client';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ApolloProvider client={client}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ApolloProvider>
  );
}
