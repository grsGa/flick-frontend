import { useRef, useEffect } from 'react';

interface RenderInfo {
  renderCount: number;
  lastRenderTime: number;
  props: any;
  componentName: string;
}

const renderHistory = new Map<string, RenderInfo>();

export function useRenderTracker(componentName: string, props: any) {
  const renderCountRef = useRef(0);
  const lastPropsRef = useRef(props);
  const currentTime = Date.now();
  
  renderCountRef.current++;
  const renderCount = renderCountRef.current;
  
  // Get or create render info for this component
  const existingInfo = renderHistory.get(componentName) || {
    renderCount: 0,
    lastRenderTime: 0,
    props: null,
    componentName
  };
  
  // Update render info
  const newInfo: RenderInfo = {
    renderCount,
    lastRenderTime: currentTime,
    props,
    componentName
  };
  renderHistory.set(componentName, newInfo);
  
  // Check for infinite render pattern
  const timeSinceLastRender = currentTime - existingInfo.lastRenderTime;
  const isInfiniteRender = renderCount > 10 && timeSinceLastRender < 100;
  
  // Log render information
  console.log(`[RenderTracker] ${componentName} render #${renderCount}`, {
    timeSinceLastRender,
    isInfiniteRender,
    propsChanged: JSON.stringify(lastPropsRef.current) !== JSON.stringify(props)
  });
  
  // Check what props changed
  if (lastPropsRef.current) {
    const changedProps = Object.keys(props).filter(key => 
      lastPropsRef.current[key] !== props[key]
    );
    if (changedProps.length > 0) {
      console.log(`[RenderTracker] ${componentName} props changed:`, changedProps);
    }
  }
  
  lastPropsRef.current = props;
  
  // Return circuit breaker function
  return {
    shouldRender: !isInfiniteRender,
    renderCount,
    isInfiniteRender
  };
}

export function getRenderHistory() {
  return Array.from(renderHistory.entries());
}

export function clearRenderHistory() {
  renderHistory.clear();
}
