"use client";

import React, { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// ============================================
// Types
// ============================================
export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface AdButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button content */
  children: React.ReactNode;
  /** Visual variant */
  variant?: ButtonVariant;
  /** Size of the button */
  size?: ButtonSize;
  /** Show loading spinner */
  isLoading?: boolean;
  /** Icon to display before button text */
  startIcon?: React.ReactNode;
  /** Icon to display after button text */
  endIcon?: React.ReactNode;
  /** Full width button */
  fullWidth?: boolean;
  /** Additional class name */
  className?: string;
}

// ============================================
// Variant Styles (Tailwind)
// ============================================
const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-primary-500 text-white hover:bg-primary-600 shadow-primary",
  secondary: "bg-primary-900 text-white hover:bg-primary-800",
  outline: "bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50",
  ghost: "text-primary-600 hover:text-primary-500 hover:bg-primary-50",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm gap-1.5",
  md: "px-4 py-2.5 text-base gap-2",
  lg: "px-6 py-3.5 text-lg gap-2.5",
};

// ============================================
// Component
// ============================================
export const AdButton = forwardRef<HTMLButtonElement, AdButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      startIcon,
      endIcon,
      fullWidth = false,
      disabled = false,
      className = "",
      type = "button",
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    const buttonClasses = twMerge(
      clsx(
        // Base styles
        "inline-flex items-center justify-center",
        "font-semibold rounded-input",
        "transition-all duration-normal",
        "focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:ring-offset-2",
        "active:scale-[0.98]",
        // Variant
        variantStyles[variant],
        // Size
        sizeStyles[size],
        // States
        fullWidth && "w-full",
        isDisabled && "opacity-60 cursor-not-allowed pointer-events-none",
        isLoading && "cursor-wait",
        className
      )
    );

    return (
      <button
        ref={ref}
        type={type}
        className={buttonClasses}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={isLoading}
        {...rest}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {!isLoading && startIcon && (
          <span className="shrink-0" aria-hidden="true">
            {startIcon}
          </span>
        )}
        <span className={isLoading ? "opacity-70" : ""}>{children}</span>
        {!isLoading && endIcon && (
          <span className="shrink-0" aria-hidden="true">
            {endIcon}
          </span>
        )}
      </button>
    );
  }
);

AdButton.displayName = "AdButton";
