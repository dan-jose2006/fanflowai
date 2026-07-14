import React from 'react';
import './SiriOrb.css';

// A simple utility to replace `cn` from clsx/tailwind-merge
const cx = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

interface SiriOrbProps {
  size?: string;
  className?: string;
  colors?: {
    bg?: string;
    c1?: string;
    c2?: string;
    c3?: string;
  };
  animationDuration?: number;
}

export const SiriOrb: React.FC<SiriOrbProps> = ({
  size = "192px",
  className,
  colors,
  animationDuration = 20,
}) => {
  const defaultColors = {
    bg: "transparent",
    c1: "oklch(75% 0.15 350)",
    c2: "oklch(80% 0.12 200)", 
    c3: "oklch(78% 0.14 280)",
  };

  const finalColors = { ...defaultColors, ...colors };
  const sizeValue = parseInt(size.replace("px", ""), 10);

  const blurAmount = Math.max(sizeValue * 0.08, 8);
  const contrastAmount = Math.max(sizeValue * 0.003, 1.8);

  return (
    <div
      className={cx("siri-orb shrink-0", className)}
      style={
        {
          width: size,
          height: size,
          "--bg": finalColors.bg,
          "--c1": finalColors.c1,
          "--c2": finalColors.c2,
          "--c3": finalColors.c3,
          "--animation-duration": `${animationDuration}s`,
          "--blur-amount": `${blurAmount}px`,
          "--contrast-amount": contrastAmount,
        } as React.CSSProperties
      }
    >
    </div>
  );
};
