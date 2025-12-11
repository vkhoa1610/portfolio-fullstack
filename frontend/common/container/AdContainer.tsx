// src/common/container/AdContainer.tsx
import React from "react";
import styles from "./AdContainer.module.css";

type AdContainerProps = {
  children: React.ReactNode;
};

export function AdContainer({ children }: AdContainerProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.blob1}></div>
      <div className={styles.blob2}></div>
      <div className={styles.blob3}></div>
      {children}
    </div>
  );
}
