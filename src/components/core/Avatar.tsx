import React from 'react';

interface AvatarProps {
  src?: string;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

const sizeClasses = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
  xl: 'w-20 h-20',
};

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = 'md',
  className = '',
  onClick,
}) => {
  const baseClasses = 'rounded-full object-cover';
  const sizeClass = sizeClasses[size];
  const classes = `${baseClasses} ${sizeClass} ${className}`;

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={classes}
        onClick={onClick}
      />
    );
  }

  // Default avatar placeholder
  return (
    <div 
      className={`${classes} bg-gray-200 flex items-center justify-center`}
      onClick={onClick}
    >
      <span className="text-gray-500 font-bold">
        {alt.charAt(0).toUpperCase()}
      </span>
    </div>
  );
};

export default Avatar;