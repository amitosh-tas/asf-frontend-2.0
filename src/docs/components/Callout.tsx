import type { ReactNode } from "react";

export type CalloutVariant = "note" | "warning" | "confirm";

interface CalloutProps {
  variant?: CalloutVariant;
  title: string;
  children: ReactNode;
}

const STYLES: Record<
  CalloutVariant,
  { box: string; title: string; icon: ReactNode }
> = {
  note: {
    box: "border-neutral-200 bg-neutral-50",
    title: "text-neutral-900",
    icon: (
      <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true" className="text-neutral-500">
        <circle cx="10" cy="10" r="7.5" />
        <path d="M10 9v4.5M10 6.5h.01" />
      </svg>
    ),
  },
  warning: {
    box: "border-amber-200 bg-amber-50",
    title: "text-amber-900",
    icon: (
      <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-amber-700">
        <path d="M10 3.5 17.5 16.5h-15L10 3.5Z" />
        <path d="M10 8.5v3.5M10 14.25h.01" />
      </svg>
    ),
  },
  confirm: {
    box: "border-indigo-200 bg-indigo-50",
    title: "text-indigo-900",
    icon: (
      <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-indigo-700">
        <circle cx="10" cy="10" r="7.5" />
        <path d="M7.9 7.9a2.2 2.2 0 1 1 3.2 2c-.7.4-1.1.9-1.1 1.6M10 13.75h.01" />
      </svg>
    ),
  },
};

export function Callout({ variant = "note", title, children }: CalloutProps) {
  const style = STYLES[variant];
  return (
    <aside
      role="note"
      className={`mt-5 rounded-xl border px-4 py-3.5 ${style.box}`}
    >
      <p className={`mt-0! flex items-center gap-2 text-sm font-semibold ${style.title}`}>
        {style.icon}
        {title}
      </p>
      <div className="callout-body mt-1.5 text-sm leading-6 text-neutral-700 [&_p]:mt-2! [&_p]:text-sm! [&_p]:leading-6! [&_ul]:mt-2! [&_ul]:text-sm!">
        {children}
      </div>
    </aside>
  );
}
