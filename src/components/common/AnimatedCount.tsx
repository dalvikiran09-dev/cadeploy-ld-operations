import React, { useEffect, useState, useRef } from 'react';

interface AnimatedCountProps {
  value: number;
  className?: string;
}

export const AnimatedCount: React.FC<AnimatedCountProps> = ({ value, className = "" }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);

  useEffect(() => {
    const startVal = prevValueRef.current;
    const endVal = value;
    if (startVal === endVal) {
      setDisplayValue(endVal);
      return;
    }

    const duration = 350; // ms animation duration
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out quad formula
      const easeProgress = 1 - (1 - progress) * (1 - progress);
      const current = Math.round(startVal + (endVal - startVal) * easeProgress);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevValueRef.current = endVal;
      }
    };

    const frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [value]);

  return <span className={className}>{displayValue}</span>;
};
