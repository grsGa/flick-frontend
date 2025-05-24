'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface LoadingScreenProps {
  /** 是否显示加载屏幕 */
  isLoading: boolean;
  /** 加载完成后的回调 */
  onLoadingComplete?: () => void;
}

/**
 * 全屏加载动画组件
 * 
 * 当页面加载或刷新时显示的动画效果
 */
export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  isLoading,
  onLoadingComplete
}) => {
  const [show, setShow] = useState(isLoading);

  useEffect(() => {
    if (isLoading) {
      setShow(true);
    } else {
      // 当isLoading变为false时，给一个短暂的延迟后完成回调
      const timer = setTimeout(() => {
        setShow(false);
        onLoadingComplete?.();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, onLoadingComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-50 bg-background"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative flex flex-col items-center">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [1, 0.8, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative w-16 h-16 md:w-20 md:h-20"
            >
              <div className="w-full h-full relative">
                <Image
                  src="/logo.svg"
                  alt="Flick Logo"
                  fill
                  priority
                  sizes="(max-width: 768px) 4rem, 5rem"
                  className="object-contain"
                />
              </div>
            </motion.div>
            <div className="h-1 w-48 bg-muted-foreground/10 rounded-full mt-6 overflow-hidden">
              <motion.div
                className="h-full bg-foreground/20 rounded-full"
                animate={{
                  x: ["-100%", "100%"],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 