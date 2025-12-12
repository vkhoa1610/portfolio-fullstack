"use client";

import React, { forwardRef, useId } from "react";
import { ChevronDown } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// ============================================
// Types
// ============================================
export type SelectSize = "sm" | "md" | "lg";

export interface AdSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  /** Label text displayed above the select */
  label?: string;
  /** Error message (sets error state) */
  error?: string;
  /** Helper text below select */
  helperText?: string;
  /** Select size */
  size?: SelectSize;
  /** Icon/element displayed at the start */
  startIcon?: React.ReactNode;
  /** Full width select */
  fullWidth?: boolean;
  /** Additional class name for select element */
  className?: string;
  /** Class name for wrapper element */
  wrapperClassName?: string;
}

// ============================================
// Size Styles
// ============================================
const sizeStyles: Record<SelectSize, string> = {
  sm: "px-3 py-1.5 text-sm pr-8",
  md: "px-4 py-2.5 text-base pr-10",
  lg: "px-5 py-3.5 text-lg pr-12",
};

const startIconPadding: Record<SelectSize, string> = {
  sm: "pl-8",
  md: "pl-10",
  lg: "pl-12",
};

const iconSizeStyles: Record<SelectSize, string> = {
  sm: "[&>svg]:w-4 [&>svg]:h-4",
  md: "[&>svg]:w-4 [&>svg]:h-4",
  lg: "[&>svg]:w-5 [&>svg]:h-5",
};

const chevronSizeStyles: Record<SelectSize, string> = {
  sm: "w-4 h-4",
  md: "w-4 h-4",
  lg: "w-5 h-5",
};

// ============================================
// Component
// ============================================
export const AdSelect = forwardRef<HTMLSelectElement, AdSelectProps>(
  (
    {
      label,
      error,
      helperText,
      size = "md",
      startIcon,
      fullWidth = true,
      className = "",
      wrapperClassName = "",
      id: providedId,
      disabled = false,
      children,
      "aria-describedby": ariaDescribedBy,
      ...rest
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = providedId || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const hasError = Boolean(error);

    // Build aria-describedby
    const describedByParts: string[] = [];
    if (ariaDescribedBy) describedByParts.push(ariaDescribedBy);
    if (hasError) describedByParts.push(errorId);
    if (helperText && !hasError) describedByParts.push(helperId);
    const describedBy = describedByParts.length > 0 ? describedByParts.join(" ") : undefined;

    const wrapperClasses = twMerge(
      clsx("flex flex-col gap-1.5", fullWidth && "w-full", wrapperClassName)
    );

    const selectContainerClasses = "relative flex items-center group";

    const selectClasses = twMerge(
      clsx(
        // Base styles
        "w-full rounded-input border bg-white",
        "text-neutral-900 appearance-none cursor-pointer",
        "transition-all duration-fast",
        "focus:outline-none focus:ring-2",
        // Size
        sizeStyles[size],
        // Start icon padding
        startIcon && startIconPadding[size],
        // Disabled state
        disabled && "opacity-60 cursor-not-allowed bg-neutral-50",
        // Normal state
        !hasError && [
          "border-neutral-300",
          "hover:border-primary-400",
          "focus:ring-primary-500/20 focus:border-primary-500",
        ],
        // Error state
        hasError && ["border-error-500", "focus:ring-error-500/20 focus:border-error-500"],
        className
      )
    );

    const iconBaseClasses =
      "absolute top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none";

    return (
      <div className={wrapperClasses}>
        {/* Label */}
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-neutral-700">
            {label}
          </label>
        )}

        {/* Select container */}
        <div className={selectContainerClasses}>
          {startIcon && (
            <span
              className={twMerge(iconBaseClasses, "left-3", iconSizeStyles[size])}
              aria-hidden="true"
            >
              {startIcon}
            </span>
          )}

          <select
            ref={ref}
            id={inputId}
            className={selectClasses}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={describedBy}
            {...rest}
          >
            {children}
          </select>

          {/* ChevronDown icon */}
          <span
            className={twMerge(
              iconBaseClasses,
              "right-3",
              "text-neutral-500 group-hover:text-neutral-700",
              "transition-colors"
            )}
            aria-hidden="true"
          >
            <ChevronDown className={chevronSizeStyles[size]} />
          </span>
        </div>

        {/* Error message */}
        {hasError && (
          <span id={errorId} className="text-error-500 text-sm" role="alert">
            {error}
          </span>
        )}

        {/* Helper text */}
        {helperText && !hasError && (
          <span id={helperId} className="text-sm text-neutral-500">
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

AdSelect.displayName = "AdSelect";
