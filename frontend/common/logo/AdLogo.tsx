// src/common/logo/AppLogo.tsx
"use client";
import React from "react";
import styles from "./AdLogo.module.css";

type AdLogoProps = {
  children?: React.ReactNode;
  size?: "default" | "small" | "tiny";
  className?: string;
};

export function AdLogo({ size = "default", className = "", children }: AdLogoProps) {
  const sizeClass = size === "small" ? styles.logoSmall : size === "tiny" ? styles.logoTiny : "";

  return <div className={`${styles.logo} ${sizeClass} ${className}`}>{children}</div>;
}
