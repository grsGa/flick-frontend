import React from 'react';

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

const PageWrapper: React.FC<PageWrapperProps> = ({ 
  children, 
  className = '',
  padding = true
}) => {
  const paddingClass = padding ? 'p-4' : '';
  
  return (
    <div className={`min-h-screen ${paddingClass} ${className}`}>
      {children}
    </div>
  );
};

export default PageWrapper;