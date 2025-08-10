'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface ProfileTabsProps {
  username: string;
}

const ProfileTabs: React.FC<ProfileTabsProps> = ({ username }) => {
  const pathname = usePathname();
  const tabs = [
    { name: 'Tweets', href: `/profile/${username}/tweets` },
    { name: 'Replies', href: `/profile/${username}/with_replies` },
    { name: 'Media', href: `/profile/${username}/media` },
    { name: 'Likes', href: `/profile/${username}/likes` },
  ];

  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex justify-around" aria-label="Tabs">
        {tabs.map((tab) => (
          <Link
            key={tab.name}
            href={tab.href}
            className={`
              flex-1 text-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${pathname === tab.href
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            {tab.name}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default ProfileTabs;
