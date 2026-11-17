import type { HTMLAttributes, ReactNode } from "react";

type SurfaceProps = HTMLAttributes<HTMLElement> & {
  as?: "section" | "div";
  children: ReactNode;
};

/** Shared card surface; pass layout and spacing through className. */
export default function Surface({
  as: Tag = "section",
  className = "",
  children,
  ...props
}: SurfaceProps) {
  return (
    <Tag
      {...props}
      className={`rounded-2xl border border-border bg-card text-text ${className}`.trim()}
    >
      {children}
    </Tag>
  );
}
