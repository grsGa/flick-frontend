'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface FollowTabsProps {
  username: string;
}

const FollowTabs: React.FC<FollowTabsProps> = ({ username }) => {
  const pathname = usePathname();
  const tabs = [
    { name: 'Followers', href: `/profile/${username}/followers` },
    { name: 'Following', href: `/profile/${username}/following` },
  ];

  return (
    <nav className="flex justify-around border-b border-gray-200">
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
  );
};

export default FollowTabs;
