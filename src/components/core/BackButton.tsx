'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AdaptiveTooltip } from '@/components/ui/AdaptiveTooltip';

const BackButton = () => {
  const router = useRouter();
  return (
    <AdaptiveTooltip content="Back">
      <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-100">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>
    </AdaptiveTooltip>
  );
};

export default BackButton;
