"use client";

import React, { forwardRef, useId } from "react";
import { Check } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// ============================================
// Types
// ============================================
export interface AdCheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Label text displayed next to the checkbox */
  label?: React.ReactNode;
  /** Error message (sets error state) */
  error?: string;
  /** Helper text below checkbox */
  helperText?: string;
  /** Additional class name for wrapper */
  className?: string;
}

// ============================================
// Component
// ============================================
export const AdCheckbox = forwardRef<HTMLInputElement, AdCheckboxProps>(
  (
    { label, error, helperText, className = "", id: providedId, disabled = false, ...rest },
    ref
  ) => {
    const generatedId = useId();
    const inputId = providedId || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const hasError = Boolean(error);

    // Build aria-describedby
    const describedByParts: string[] = [];
    if (hasError) describedByParts.push(errorId);
    if (helperText && !hasError) describedByParts.push(helperId);
    const describedBy = describedByParts.length > 0 ? describedByParts.join(" ") : undefined;

    const wrapperClasses = twMerge(clsx("flex flex-col gap-1", className));

    const checkboxContainerClasses = clsx(
      "flex items-start gap-3 cursor-pointer group",
      disabled && "cursor-not-allowed opacity-60"
    );

    const checkboxBoxClasses = clsx(
      // Base checkbox box styles
      "relative flex items-center justify-center",
      "h-5 w-5 shrink-0 mt-0.5",
      "rounded border-2 transition-all duration-fast",
      // Default state
      "border-neutral-300 bg-white",
      // Hover state (when not disabled)
      !disabled && "group-hover:border-primary-500",
      // Focus state is handled via peer-focus
      // Checked state - using peer-checked
      "peer-checked:bg-success-500 peer-checked:border-success-500",
      // Error state
      hasError && "border-error-500"
    );

    return (
      <div className={wrapperClasses}>
        <label className={checkboxContainerClasses}>
          {/* Hidden native checkbox */}
          <input
            ref={ref}
            type="checkbox"
            id={inputId}
            disabled={disabled}
            className={clsx(
              "peer",
              "h-5 w-5 cursor-pointer appearance-none",
              "absolute opacity-0",
              disabled && "cursor-not-allowed"
            )}
            aria-invalid={hasError}
            aria-describedby={describedBy}
            {...rest}
          />

          {/* Custom checkbox box */}
          <div className={checkboxBoxClasses} aria-hidden="true">
            {/* Check icon - visible when checked */}
            <Check
              className={clsx(
                "h-3.5 w-3.5 text-white",
                "opacity-0 peer-checked:opacity-100",
                "duration-fast transition-opacity",
                "pointer-events-none"
              )}
            />
          </div>

          {/* Label text */}
          {label && (
            <span
              className={clsx(
                "text-sm font-medium text-neutral-700",
                "transition-colors select-none",
                !disabled && "group-hover:text-neutral-900"
              )}
            >
              {label}
            </span>
          )}
        </label>

        {/* Error message */}
        {hasError && (
          <span id={errorId} className="text-error-500 ml-8 text-sm" role="alert">
            {error}
          </span>
        )}

        {/* Helper text */}
        {helperText && !hasError && (
          <span id={helperId} className="ml-8 text-sm text-neutral-500">
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

AdCheckbox.displayName = "AdCheckbox";
