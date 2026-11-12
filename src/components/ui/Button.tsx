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
  primary: "border border-primary/70 bg-primary text-on-primary shadow-[0_5px_14px_rgba(110,145,54,0.16)] hover:-translate-y-px hover:bg-primary-hover hover:shadow-[0_8px_20px_rgba(110,145,54,0.2)]",
  secondary: "border border-border/70 bg-surface-muted text-text hover:bg-active",
  outline: "border border-border bg-card text-text shadow-sm hover:border-border hover:bg-hover",
  ghost: "text-text-muted hover:bg-hover hover:text-text",
  destructive: "border border-danger/30 bg-danger/5 text-danger hover:bg-danger/10",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-9 rounded-lg px-3 py-1.5 text-xs",
  md: "min-h-11 rounded-xl px-4 py-2.5 text-sm",
  lg: "min-h-12 rounded-xl px-5 text-sm",
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
        "transition-all duration-150 focus-visible:ring-2 focus-visible:ring-primary/40",
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
