"use client";

import React from "react";
import styles from "./AdLabel.module.css";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export function AdLabel({ children, className = "" }: Props) {
  return <label className={`${styles.label} ${className}`}>{children}</label>;
}
