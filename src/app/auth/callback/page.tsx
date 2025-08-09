'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

// Define the User interface to match the expected structure
interface User {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
}

const AuthCallbackContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');
    const error = searchParams.get('error');

    if (error) {
      console.error('OAuth Error:', error);
      // Redirect to login page with an error message
      router.push('/login?error=oauth_failed');
      return;
    }

    if (token && userParam) {
      try {
        // Decode the user JSON object from the URL parameter
        const user: User = JSON.parse(decodeURIComponent(userParam));
        
        // Use the login function from the auth context to store credentials
        login(token, user);
        
        // Redirect to the home page after successful login
        router.push('/home');
      } catch (e) {
        console.error('Failed to parse user data from URL:', e);
        router.push('/login?error=invalid_user_data');
      }
    } else {
      // If token or user is missing, redirect to login
      router.push('/login?error=missing_credentials');
    }
  }, [router, searchParams, login]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <p className="text-lg font-semibold">Authenticating, please wait...</p>
        {/* You can add a spinner or loading animation here */}
      </div>
    </div>
  );
};

const AuthCallbackPage: React.FC = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthCallbackContent />
    </Suspense>
  );
};

export default AuthCallbackPage;
