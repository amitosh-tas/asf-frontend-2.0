import type { SelectHTMLAttributes } from "react";

export default function Select({
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={[
        "h-11 min-w-0 rounded-xl border border-border bg-card px-3.5 text-sm text-text shadow-[inset_0_1px_1px_rgba(20,35,22,0.025)]",
        "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      ].join(" ")}
    />
  );
}
