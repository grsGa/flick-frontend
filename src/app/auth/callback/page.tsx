'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

// Define the User interface to match the backend structure (snake_case)
interface BackendUser {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  email?: string;
  login_method?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

// Frontend User interface (camelCase)
interface User {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  isVerified?: boolean;
}

const AuthCallbackContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');
    const error = searchParams.get('error');

    console.log('[OAuth Callback] Processing callback', { 
      hasToken: !!token, 
      hasUser: !!userParam, 
      error 
    });

    if (error) {
      console.error('[OAuth Callback] OAuth Error:', error);
      // Redirect to login page with an error message
      router.push('/login?error=oauth_failed');
      return;
    }

    if (token && userParam) {
      try {
        // Decode the user JSON object from the URL parameter (backend uses snake_case)
        const backendUser: BackendUser = JSON.parse(decodeURIComponent(userParam));
        
        console.log('[OAuth Callback] Successfully parsed backend user data', { 
          username: backendUser.username, 
          id: backendUser.id 
        });
        
        // Transform backend user (snake_case) to frontend user (camelCase)
        const user: User = {
          id: backendUser.id,
          username: backendUser.username,
          displayName: backendUser.display_name,
          avatarUrl: backendUser.avatar_url,
          isVerified: false // OAuth users are not verified by default
        };
        
        console.log('[OAuth Callback] Transformed user data for frontend', { 
          username: user.username, 
          id: user.id,
          displayName: user.displayName
        });
        
        // Use the login function from the auth context to store credentials
        login(token, user);
        
        console.log('[OAuth Callback] Login complete, redirecting to /home');
        
        // Redirect to the home page after successful login
        router.push('/home');
      } catch (e) {
        console.error('[OAuth Callback] Failed to parse user data from URL:', e);
        router.push('/login?error=invalid_user_data');
      }
    } else {
      // If token or user is missing, redirect to login
      console.warn('[OAuth Callback] Missing credentials', { 
        hasToken: !!token, 
        hasUser: !!userParam 
      });
      router.push('/login?error=missing_credentials');
    }
  }, [searchParams, router, login]);

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
