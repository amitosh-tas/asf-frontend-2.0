import type { HTMLAttributes } from "react";

export type BadgeVariant = "neutral" | "success" | "warning" | "danger" | "primary";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  neutral: "bg-text-muted/10 text-text-muted ring-text-muted/20",
  success: "bg-success/10 text-success ring-success/30",
  warning: "bg-warning/10 text-warning ring-warning/30",
  danger: "bg-danger/10 text-danger ring-danger/30",
  primary: "bg-primary/10 text-primary ring-primary/30",
};

export default function Badge({
  variant = "neutral",
  className = "",
  ...props
}: BadgeProps) {
  return (
    <span
      {...props}
      className={[
        "inline-flex w-max items-center rounded-md px-2 py-0.5 text-[11px] font-semibold",
        "ring-1 ring-inset",
        variantClasses[variant],
        className,
      ].join(" ")}
    />
  );
}
