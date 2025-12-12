"use client";

import React, { forwardRef } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// ============================================
// Types
// ============================================
export interface AdCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Card content */
  children: React.ReactNode;
  /** Additional class name */
  className?: string;
}

// ============================================
// Component
// ============================================
export const AdCard = forwardRef<HTMLDivElement, AdCardProps>(
  ({ children, className = "", ...rest }, ref) => {
    const cardClasses = twMerge(
      clsx(
        // Base styles matching auth screen design
        "bg-white rounded-card shadow-xl",
        "border border-surface-border",
        "overflow-hidden",
        className
      )
    );

    return (
      <div ref={ref} className={cardClasses} {...rest}>
        {children}
      </div>
    );
  }
);

AdCard.displayName = "AdCard";
