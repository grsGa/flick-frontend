"use client";

import React, { useEffect } from 'react';
import { AuthProvider } from '@/hooks/useAuth';
import { ApolloProvider } from '@apollo/client';
import client from '@/lib/apollo-client';
import { MediaService } from '@/services/mediaService';

export function Providers({ children }: { children: React.ReactNode }) {
  console.log('[Providers] Rendering providers');
  
  // Initialize MediaService with Apollo client
  useEffect(() => {
    MediaService.setApolloClient(client);
  }, []);
  
  return (
    <ApolloProvider client={client}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ApolloProvider>
  );
}
