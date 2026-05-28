'use client';

import { type ReactNode } from 'react';
import { motion } from 'framer-motion';

interface Props {
  children: ReactNode;
  /** Custom key forces a remount transition, e.g. on route change. */
  motionKey?: string;
}

export function MotionPage({ children, motionKey }: Props) {
  return (
    <motion.div
      key={motionKey}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.32, ease: [0.19, 1, 0.22, 1] }}
      style={{ width: '100%', minHeight: '100%' }}
    >
      {children}
    </motion.div>
  );
}
