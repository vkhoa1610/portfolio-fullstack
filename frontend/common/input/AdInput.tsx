"use client";

import React, { forwardRef, useId } from "react";
import styles from "./AdInput.module.css";

// ============================================
// Types
// ============================================
export type InputSize = "sm" | "md" | "lg";

export interface AdInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Show error state */
  error?: boolean;
  /** Error message to display */
  errorMessage?: string;
  /** Helper text below input */
  helperText?: string;
  /** Input size */
  size?: InputSize;
  /** Left icon/element */
  leftIcon?: React.ReactNode;
  /** Right icon/element */
  rightIcon?: React.ReactNode;
  /** Full width input */
  fullWidth?: boolean;
  /** Additional class name */
  className?: string;
  /** Wrapper class name */
  wrapperClassName?: string;
}

// ============================================
// Component
// ============================================
export const AdInput = forwardRef<HTMLInputElement, AdInputProps>(
  (
    {
      error = false,
      errorMessage,
      helperText,
      size = "md",
      leftIcon,
      rightIcon,
      fullWidth = true,
      className = "",
      wrapperClassName = "",
      id: providedId,
      "aria-describedby": ariaDescribedBy,
      ...rest
    },
    ref
  ) => {
    // Generate unique ID for accessibility
    const generatedId = useId();
    const inputId = providedId || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    // Build aria-describedby
    const describedByParts: string[] = [];
    if (ariaDescribedBy) describedByParts.push(ariaDescribedBy);
    if (error && errorMessage) describedByParts.push(errorId);
    if (helperText && !error) describedByParts.push(helperId);
    const describedBy = describedByParts.length > 0 ? describedByParts.join(" ") : undefined;

    const wrapperClasses = [styles.wrapper, fullWidth ? styles.fullWidth : "", wrapperClassName]
      .filter(Boolean)
      .join(" ");

    const inputClasses = [
      styles.input,
      styles[size],
      error ? styles.inputError : "",
      leftIcon ? styles.hasLeftIcon : "",
      rightIcon ? styles.hasRightIcon : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={wrapperClasses}>
        <div className={styles.inputContainer}>
          {leftIcon && (
            <span className={styles.leftIcon} aria-hidden="true">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className={inputClasses}
            aria-invalid={error}
            aria-describedby={describedBy}
            {...rest}
          />

          {rightIcon && (
            <span className={styles.rightIcon} aria-hidden="true">
              {rightIcon}
            </span>
          )}
        </div>

        {/* Error message */}
        {error && errorMessage && (
          <span id={errorId} className={styles.errorMessage} role="alert">
            {errorMessage}
          </span>
        )}

        {/* Helper text (only show when no error) */}
        {helperText && !error && (
          <span id={helperId} className={styles.helperText}>
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

AdInput.displayName = "AdInput";
