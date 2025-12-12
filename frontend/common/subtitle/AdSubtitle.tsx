"use client";

import React, { forwardRef } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// ============================================
// Types
// ============================================
export interface AdSubtitleProps extends React.HTMLAttributes<HTMLParagraphElement> {
  /** Subtitle content */
  children: React.ReactNode;
  /** Additional class name */
  className?: string;
}

// ============================================
// Component
// ============================================
export const AdSubtitle = forwardRef<HTMLParagraphElement, AdSubtitleProps>(
  ({ children, className = "", ...rest }, ref) => {
    const subtitleClasses = twMerge(clsx("text-sm text-neutral-500", className));

    return (
      <p ref={ref} className={subtitleClasses} {...rest}>
        {children}
      </p>
    );
  }
);

AdSubtitle.displayName = "AdSubtitle";
