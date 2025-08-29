'use client';

import React, { useState } from 'react';

export type HomeTabType = 'foryou' | 'following';

interface HomeTabsProps {
  activeTab: HomeTabType;
  onTabChange: (tab: HomeTabType) => void;
}

export default function HomeTabs({ activeTab, onTabChange }: HomeTabsProps) {
  return (
    <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="flex">
        {/* For You Tab */}
        <button
          onClick={() => onTabChange('foryou')}
          className={`flex-1 py-4 px-4 text-center font-medium transition-colors relative ${
            activeTab === 'foryou'
              ? 'text-black'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          For you
          {activeTab === 'foryou' && (
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-blue-500 rounded-full" />
          )}
        </button>

        {/* Following Tab */}
        <button
          onClick={() => onTabChange('following')}
          className={`flex-1 py-4 px-4 text-center font-medium transition-colors relative ${
            activeTab === 'following'
              ? 'text-black'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Following
          {activeTab === 'following' && (
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-blue-500 rounded-full" />
          )}
        </button>
      </div>
    </div>
  );
}
