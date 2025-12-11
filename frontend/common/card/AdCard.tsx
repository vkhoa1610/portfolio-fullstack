// src/common/card/AdCard.tsx
import React from "react";
import styles from "./AdCard.module.css";

type AdCardProps = {
  children: React.ReactNode;
  /** Kích thước card */
  size?: "default" | "small" | "large";
  /** Bật viền gradient khi hover */
  gradientBorder?: boolean;
  /** Class bổ sung từ bên ngoài */
  className?: string;
};

export function AdCard({
  children,
  size = "default",
  gradientBorder = false,
  className = "",
}: AdCardProps) {
  const baseClasses = styles.card;

  const sizeClass = size === "small" ? styles.cardSmall : size === "large" ? styles.cardLarge : "";

  const gradientClass = gradientBorder ? styles.cardGradientBorder : "";

  const combinedClass = `${baseClasses} ${sizeClass} ${gradientClass} ${className}`.trim();

  return <div className={combinedClass}>{children}</div>;
}
