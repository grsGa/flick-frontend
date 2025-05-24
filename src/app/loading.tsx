'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function Loading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-background">
      <div className="flex flex-col items-center space-y-6">
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
          className="relative w-20 h-20 md:w-24 md:h-24"
        >
          <Image
            src="/logo.svg"
            alt="Flick Logo"
            fill
            priority
            sizes="(max-width: 768px) 5rem, 6rem"
            className="object-contain"
          />
        </motion.div>
        
        <div className="w-48 h-1 bg-muted-foreground/10 rounded-full overflow-hidden">
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
    </div>
  );
} 