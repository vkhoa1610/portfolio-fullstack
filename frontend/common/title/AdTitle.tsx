"use client";

import React, { forwardRef } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// ============================================
// Types
// ============================================
export interface AdTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** Title content */
  children: React.ReactNode;
  /** HTML element to render */
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  /** Additional class name */
  className?: string;
}

// ============================================
// Component
// ============================================
export const AdTitle = forwardRef<HTMLHeadingElement, AdTitleProps>(
  ({ children, as: Component = "h1", className = "", ...rest }, ref) => {
    const titleClasses = twMerge(clsx("text-2xl font-bold text-neutral-900", className));

    return (
      <Component ref={ref} className={titleClasses} {...rest}>
        {children}
      </Component>
    );
  }
);

AdTitle.displayName = "AdTitle";
