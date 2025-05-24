import React from 'react';
import { cn } from '@/lib/utils';
import { BadgeCheck } from 'lucide-react';

interface VerifiedBadgeProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function VerifiedBadge({ size = 'medium', className }: VerifiedBadgeProps) {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6'
  };
  
  return (
    <span 
      className={cn(
        "text-primary flex items-center justify-center", 
        className
      )} 
      title="已验证用户"
    >
      <BadgeCheck className={sizeClasses[size]} />
    </span>
  );
} 