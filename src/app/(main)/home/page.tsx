'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import MainContainer from '@/components/layout/MainContainer';
import HomeTabs, { HomeTabType } from '@/components/home/HomeTabs';
import HomeFeed from '@/components/home/HomeFeed';

export default function Home() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<HomeTabType>(() => {
    const tab = searchParams.get('tab') as HomeTabType;
    return tab === 'following' ? 'following' : 'foryou';
  });

  const handleTabChange = (tab: HomeTabType) => {
    setActiveTab(tab);
    // Update URL to persist tab state
    const url = new URL(window.location.href);
    if (tab === 'following') {
      url.searchParams.set('tab', 'following');
    } else {
      url.searchParams.delete('tab');
    }
    router.replace(url.pathname + url.search);
  };

  return (
    <MainContainer showTopBar={false}>
      <HomeTabs activeTab={activeTab} onTabChange={handleTabChange} />
      <HomeFeed activeTab={activeTab} />
    </MainContainer>
  );
}