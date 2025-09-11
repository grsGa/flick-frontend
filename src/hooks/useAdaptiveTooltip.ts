import { useState, useEffect, useRef } from 'react';

interface TooltipPosition {
  direction: 'up' | 'down';
  left: number;
}

export function useAdaptiveTooltip() {
  const [position, setPosition] = useState<TooltipPosition>({ direction: 'down', left: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const buttonRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const showTooltip = () => {
    setIsVisible(true);
    
    if (buttonRef.current && tooltipRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const scrollY = window.scrollY;
      
      // Calculate space above and below the button
      const spaceBelow = viewportHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;
      
      // Default to down, but switch to up if not enough space below
      const direction = spaceBelow < 60 && spaceAbove > 60 ? 'up' : 'down';
      
      // Calculate horizontal position to keep tooltip centered but within viewport
      const buttonCenter = buttonRect.left + buttonRect.width / 2;
      const tooltipHalfWidth = tooltipRect.width / 2;
      let left = buttonCenter - tooltipHalfWidth;
      
      // Adjust if tooltip would go outside viewport
      const viewportWidth = window.innerWidth;
      if (left < 8) left = 8;
      if (left + tooltipRect.width > viewportWidth - 8) {
        left = viewportWidth - tooltipRect.width - 8;
      }
      
      setPosition({ direction, left });
    }
  };

  const hideTooltip = () => {
    setIsVisible(false);
  };

  return {
    buttonRef,
    tooltipRef,
    isVisible,
    position,
    showTooltip,
    hideTooltip,
  };
}
