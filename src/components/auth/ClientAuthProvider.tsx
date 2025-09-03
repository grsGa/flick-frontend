"use client";

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

// Loading component for SSR
function AuthLoading({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}

// Dynamically import AuthProvider with no SSR
const AuthProvider = dynamic(
  () => import('@/hooks/useAuth').then(mod => ({ default: mod.AuthProvider })),
  {
    ssr: false,
    loading: () => <AuthLoading children={undefined} />
  }
);

export function ClientAuthProvider({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
