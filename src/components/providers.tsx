"use client";

import React from 'react';
import { ApolloProvider } from '@apollo/client';
import { createApolloClient } from '@/lib/apollo-client';
import { ThemeProvider } from './theme-provider';
import { AuthProvider } from '@/lib/auth-context';
import { TokenPassthroughProvider } from '@/lib/token-passthrough';
import { LoadingProvider } from '@/lib/loading-context';

interface ProvidersProps {
  children: React.ReactNode;
}

// 创建Apollo客户端
const client = createApolloClient();

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ApolloProvider client={client}>
        <TokenPassthroughProvider client={client}>
          <AuthProvider>
            <LoadingProvider>
              {children}
            </LoadingProvider>
          </AuthProvider>
        </TokenPassthroughProvider>
      </ApolloProvider>
    </ThemeProvider>
  );
}

export default Providers; 