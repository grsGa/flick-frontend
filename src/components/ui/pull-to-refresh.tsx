'use client';

import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useLoading } from '@/lib/loading-context';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh?: () => Promise<void>;
  threshold?: number;
  className?: string;
}

/**
 * 下拉刷新组件
 * 
 * 允许用户在移动设备上下拉页面触发刷新动作
 */
export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  threshold = 100,
  className
}) => {
  const { startLoading, finishLoading } = useLoading();
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);

  // 处理触摸开始事件
  const handleTouchStart = (e: TouchEvent) => {
    if (window.scrollY <= 0) {
      // 只有当页面滚动到顶部时才启用下拉刷新
      startYRef.current = e.touches[0].clientY;
      isDraggingRef.current = true;
    }
  };

  // 处理触摸移动事件
  const handleTouchMove = (e: TouchEvent) => {
    if (!isDraggingRef.current) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - startYRef.current;

    if (distance > 0 && window.scrollY <= 0) {
      // 页面在顶部并且向下拉动
      setPullDistance(Math.min(distance * 0.5, threshold * 1.5)); // 添加阻尼效果
      e.preventDefault();
    }
  };

  // 处理触摸结束事件
  const handleTouchEnd = async () => {
    if (!isDraggingRef.current) return;
    
    isDraggingRef.current = false;
    
    if (pullDistance >= threshold) {
      // 达到刷新阈值
      setIsRefreshing(true);
      startLoading(); // 开始显示全局加载动画
      
      try {
        if (onRefresh) {
          await onRefresh();
        } else {
          // 如果没有提供刷新回调，模拟刷新行为
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      } finally {
        setPullDistance(0);
        setIsRefreshing(false);
        finishLoading(); // 结束全局加载动画
      }
    } else {
      // 未达到阈值，恢复初始状态
      setPullDistance(0);
    }
  };

  // 添加和移除事件监听器
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [threshold, onRefresh, pullDistance]);

  return (
    <div ref={containerRef} className={className}>
      {pullDistance > 0 && (
        <motion.div 
          className="fixed top-0 left-0 w-full flex justify-center z-40 pointer-events-none"
          style={{ 
            height: pullDistance,
            opacity: pullDistance / threshold 
          }}
        >
          <div className="flex items-center justify-center h-full">
            <motion.div
              animate={{ rotate: isRefreshing ? 360 : 0 }}
              transition={{ duration: 1, repeat: isRefreshing ? Infinity : 0, ease: "linear" }}
              className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
            />
          </div>
        </motion.div>
      )}
      {children}
    </div>
  );
}; 