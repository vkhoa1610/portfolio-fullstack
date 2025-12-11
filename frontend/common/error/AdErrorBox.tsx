"use client";

import React from "react";
import styles from "./AdErrorBox.module.css";

type AdErrorBoxProps = {
  children: React.ReactNode;
  className?: string;
};

export function AdErrorBox({ children, className = "" }: AdErrorBoxProps) {
  if (!children) return null;

  return <div className={`${styles.errorBox} ${className}`}>{children}</div>;
}
