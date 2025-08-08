"use client";

import React from 'react';
import AppLayout from '@/components/layout/RootLayout';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null; // Or a loading spinner
  }

  return (
    <AppLayout>
      {children}
    </AppLayout>
  );
}
