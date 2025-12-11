"use client";

import React from "react";
import styles from "./AdLink.module.css";

type AdLinkProps = {
  children: React.ReactNode;
  href?: string;
  className?: string;
  align?: string;
};

export function AdLink({ children, href = "#", className = "", align }: AdLinkProps) {
  const alignClass = align === "right" ? styles.right : "";
  return (
    <a href={href} className={`${styles.link} ${alignClass} ${className}`}>
      {children}
    </a>
  );
}
