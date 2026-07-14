import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

export const AnimatedCounter = ({ 
  value, 
  suffix = '',
  duration = 2
}: { 
  value: number; 
  suffix?: string;
  duration?: number;
}) => {
  const [isInView, setIsInView] = useState(false);
  const springValue = useSpring(0, { duration: duration * 1000, bounce: 0 });
  const displayValue = useTransform(springValue, (current) => {
    return Math.floor(current).toLocaleString() + suffix;
  });

  useEffect(() => {
    if (isInView) {
      springValue.set(value);
    }
  }, [isInView, value, springValue]);

  return (
    <motion.span 
      onViewportEnter={() => setIsInView(true)}
      viewport={{ once: true, margin: "-50px" }}
    >
      {displayValue}
    </motion.span>
  );
};
