"use client";

import React from "react";
import styles from "./AdTitle.module.css";

type AdTitleProps = {
  children: React.ReactNode;
  className?: string;
  size?: "default" | "large" | "small";
};

export function AdTitle({ children, className = "", size = "default" }: AdTitleProps) {
  const sizeClass =
    size === "large" ? styles.titleLarge : size === "small" ? styles.titleSmall : "";

  return <h1 className={`${styles.title} ${sizeClass} ${className}`}>{children}</h1>;
}
