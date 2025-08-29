"use client";

import React from 'react';
import { AuthProvider } from '@/hooks/useAuth';
import { ApolloProvider } from '@apollo/client';
import client from '@/lib/apollo-client';

export function Providers({ children }: { children: React.ReactNode }) {
  console.log('[Providers] Rendering providers');
  
  return (
    <ApolloProvider client={client}>
      <AuthProvider>
        {/* Temporarily disable React.StrictMode to test if it's causing infinite renders */}
        {children}
      </AuthProvider>
    </ApolloProvider>
  );
}
