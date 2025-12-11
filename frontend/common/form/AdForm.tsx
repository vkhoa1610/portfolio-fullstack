"use client";

import React from "react";
import styles from "./AdForm.module.css";

type AdFormProps = {
  children: React.ReactNode;
  onSubmit?: React.FormEventHandler<HTMLFormElement>;
  className?: string;
};

export function AdForm({ children, onSubmit, className = "" }: AdFormProps) {
  return (
    <form onSubmit={onSubmit} className={`${styles.form} ${className}`}>
      {children}
    </form>
  );
}
