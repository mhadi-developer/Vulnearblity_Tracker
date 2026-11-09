"use client";
import { useEffect, useState } from "react";

/** Counts from 0 to target with a damped spring, so the number settles with a small bounce. */
export function useCountUp(target: number, run: boolean): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!run) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return undefined;
    }
    const Z = 0.6;
    const W = 13;
    const WD = W * Math.sqrt(1 - Z * Z);
    const spring = (t: number): number =>
      t >= 1 ? 1 : 1 - Math.exp(-Z * W * t) * (Math.cos(WD * t) + ((Z * W) / WD) * Math.sin(WD * t));

    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min((now - t0) / 1000, 1);
      setValue(Math.round(target * spring(t)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run]);

  return value;
}