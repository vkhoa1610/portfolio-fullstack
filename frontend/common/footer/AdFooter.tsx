"use client";

import React from "react";
import styles from "./AdFooter.module.css";

type AdFooterProps = {
  children: React.ReactNode;
  className?: string;
};

export function AdFooter({ children, className = "" }: AdFooterProps) {
  return <div className={`${styles.footer} ${className}`}>{children}</div>;
}
