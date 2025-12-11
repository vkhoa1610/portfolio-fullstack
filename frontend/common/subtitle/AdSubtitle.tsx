"use client";

import React from "react";
import styles from "./AdSubtitle.module.css";

type AdSubtitleProps = {
  children: React.ReactNode;
  className?: string;
  size?: "default" | "small";
};

export function AdSubtitle({ children, className = "", size = "default" }: AdSubtitleProps) {
  const sizeClass = size === "small" ? styles.subtitleSmall : "";

  return <p className={`${styles.subtitle} ${sizeClass} ${className}`}>{children}</p>;
}
