import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white shadow-sm hover:bg-neutral-800",
  secondary: "bg-surface-muted text-text hover:bg-active",
  outline: "border border-border bg-card text-text shadow-sm hover:bg-hover",
  ghost: "text-text-muted hover:bg-hover hover:text-text",
  destructive: "border border-danger/30 text-danger hover:bg-danger/5",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-8 rounded-md px-2.5 py-1.5 text-xs",
  md: "min-h-10 rounded-md px-3.5 py-2 text-sm",
  lg: "min-h-11 rounded-md px-4 text-sm",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  className = "",
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={[
        "inline-flex cursor-pointer items-center justify-center gap-2 font-medium",
        "transition-colors focus-visible:ring-2 focus-visible:ring-primary/40",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(" ")}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
        />
      )}
      {!loading && icon}
      {children}
    </button>
  );
}
