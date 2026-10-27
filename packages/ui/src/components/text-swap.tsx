import { AnimatePresence } from 'motion/react';
import * as motion from 'motion/react-m';
import { cn } from '../lib/cn';
import { TEXT_SWAP } from '../services/text-swap/text-swap.constants';

interface TextSwapProps {
  text: string
  isReduced: boolean
  direction?: number
  className?: string
}

export function TextSwap({ text, isReduced, direction = 1, className }: TextSwapProps) {
  return (
    <span className="relative block min-w-0">
      <AnimatePresence custom={direction} initial={false} mode="popLayout">
        <motion.span
          animate="shown"
          className={cn('inline-block', className)}
          custom={direction}
          exit="gone"
          initial="hidden"
          key={text}
          variants={isReduced ? TEXT_SWAP.fade : TEXT_SWAP.rise}
        >
          {text}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
