"use client";

import React from "react";
import styles from "./AdFormGroup.module.css";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export function AdFormGroup({ children, className = "" }: Props) {
  return <div className={`${styles.inputGroup} ${className}`}>{children}</div>;
}
