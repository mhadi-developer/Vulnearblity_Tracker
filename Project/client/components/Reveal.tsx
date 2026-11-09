"use client";
import {
  useEffect,
  useState,
  type CSSProperties,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { useInView } from "../hooks/useInView";
import "../styles/common.css";
import "../styles/reveal.css";

type RevealTag = "div" | "article" | "li" | "section";

interface RevealProps extends HTMLAttributes<HTMLElement> {
  as?: RevealTag;
  /** Stagger delay in milliseconds */
  delay?: number;
  children?: ReactNode;
}

/** Fades and springs its children into place when they scroll into view. */
export default function Reveal({
  as = "div",
  delay = 0,
  className = "",
  style,
  children,
  ...rest
}: RevealProps) {
  const [ref, seen] = useInView<HTMLElement>(0.15);
  const [done, setDone] = useState(false);

  // After the entrance finishes, drop the stagger delay so hover effects respond instantly.
  useEffect(() => {
    if (!seen) return undefined;
    const id = window.setTimeout(() => setDone(true), delay + 900);
    return () => window.clearTimeout(id);
  }, [seen, delay]);

  const Tag = as as ElementType;
  const css = { ...style, "--reveal-delay": `${delay}ms` } as CSSProperties;
  const classes = ["reveal", seen && "is-in", done && "is-done", className].filter(Boolean).join(" ");

  return (
    <Tag ref={ref} className={classes} style={css} {...rest}>
      {children}
    </Tag>
  );
}