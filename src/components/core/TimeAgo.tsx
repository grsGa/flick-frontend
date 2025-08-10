'use client';

import React, { useState, useEffect } from 'react';
import { formatTimeAgo } from '@/lib/utils';

interface TimeAgoProps {
  date: string;
  className?: string;
}

const TimeAgo: React.FC<TimeAgoProps> = ({ date, className = '' }) => {
  const [timeAgo, setTimeAgo] = useState(formatTimeAgo(date));

  useEffect(() => {
    // Update time ago every minute
    const timer = setInterval(() => {
      setTimeAgo(formatTimeAgo(date));
    }, 60000);

    return () => clearInterval(timer);
  }, [date]);

  return (
    <time 
      dateTime={date} 
      className={`text-gray-500 text-sm ${className}`}
      title={new Date(date).toLocaleString()}
    >
      {timeAgo}
    </time>
  );
};

export default TimeAgo;
