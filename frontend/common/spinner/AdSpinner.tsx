"use client";

import React from "react";
import styles from "./AdSpinner.module.css";

type SpinnerProps = {
  size?: "default" | "small";
  className?: string;
};

export function AdSpinner({ size = "default", className = "" }: SpinnerProps) {
  const sizeClass = size === "small" ? styles.small : "";

  return <span className={`${styles.spinner} ${sizeClass} ${className}`} />;
}
