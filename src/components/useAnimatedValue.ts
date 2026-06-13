// src/components/useAnimatedValue.ts
// 数字滚动动画 hook — 从旧值平滑过渡到新值

import { useState, useEffect, useRef } from 'react';

/**
 * 让数值在变化时产生平滑过渡动画（而非瞬间跳变）。
 * 适合作品集展示中"数值变了吗"的可感知性。
 */
export function useAnimatedValue(
  target: number,
  duration: number = 300,
): number {
  const [display, setDisplay] = useState(target);
  const currentRef = useRef(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === currentRef.current) {
      setDisplay(target);
      return;
    }

    const startValue = currentRef.current;
    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      const current = startValue + (target - startValue) * eased;

      setDisplay(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        currentRef.current = target;
        setDisplay(target);
      }
    }

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [target, duration]);

  return display;
}
