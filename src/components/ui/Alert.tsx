import type { ReactNode } from "react";

interface AlertProps {
  children: ReactNode;
  variant?: "error" | "info";
}

export default function Alert({ children, variant = "error" }: AlertProps) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={[
        "rounded-xl border px-4 py-3 text-sm leading-6",
        variant === "error"
          ? "border-danger/20 bg-danger/5 text-danger"
          : "border-primary/20 bg-primary/5 text-text",
      ].join(" ")}
    >
      {children}
    </div>
  );
}
