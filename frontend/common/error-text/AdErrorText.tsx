"use client";

import React from "react";
import styles from "./AdErrorText.module.css";

export function AdErrorText({ children }: { children: React.ReactNode }) {
  return <span className={styles.errorText}>{children}</span>;
}
