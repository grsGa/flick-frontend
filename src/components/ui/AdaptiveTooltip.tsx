'use client';

import React, { useRef, useEffect, useState } from 'react';

interface AdaptiveTooltipProps {
  children: React.ReactNode;
  content: string;
  disabled?: boolean;
}

export function AdaptiveTooltip({ children, content, disabled = false }: AdaptiveTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<{ direction: 'up' | 'down'; adjustedLeft?: number }>({ direction: 'down' });
  const buttonRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (!buttonRef.current || !tooltipRef.current) return;

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    
    // Calculate space above and below the button
    const spaceBelow = viewportHeight - buttonRect.bottom;
    const spaceAbove = buttonRect.top;
    
    // Default to down, but switch to up if not enough space below and enough space above
    const direction = spaceBelow < 80 && spaceAbove > 80 ? 'up' : 'down';
    
    // Calculate horizontal position to keep tooltip centered but within viewport
    const buttonCenter = buttonRect.left + buttonRect.width / 2;
    const tooltipHalfWidth = tooltipRect.width / 2;
    let adjustedLeft = buttonCenter - tooltipHalfWidth;
    
    // Adjust if tooltip would go outside viewport
    const viewportWidth = window.innerWidth;
    if (adjustedLeft < 8) adjustedLeft = 8;
    if (adjustedLeft + tooltipRect.width > viewportWidth - 8) {
      adjustedLeft = viewportWidth - tooltipRect.width - 8;
    }
    
    setPosition({ direction, adjustedLeft });
  };

  const showTooltip = () => {
    if (disabled) return;
    setIsVisible(true);
  };

  const hideTooltip = () => {
    setIsVisible(false);
  };

  useEffect(() => {
    if (isVisible) {
      // Small delay to allow tooltip to render before calculating position
      const timer = setTimeout(updatePosition, 10);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  return (
    <div 
      ref={buttonRef}
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
    >
      {children}
      
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`absolute z-50 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap pointer-events-none ${
            position.direction === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
          style={{
            left: position.adjustedLeft !== undefined ? `${position.adjustedLeft - (buttonRef.current?.getBoundingClientRect().left || 0)}px` : '50%',
            transform: position.adjustedLeft !== undefined ? 'none' : 'translateX(-50%)'
          }}
        >
          {content}
          <div 
            className={`absolute left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-transparent ${
              position.direction === 'up' 
                ? 'top-full border-t-4 border-t-gray-800' 
                : 'bottom-full border-b-4 border-b-gray-800'
            }`}
          />
        </div>
      )}
    </div>
  );
}
