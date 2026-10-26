import type { ReactNode } from "react";

interface RevenueLedgerProps {
  children: ReactNode;
}

function RevenueLedger({ children }: RevenueLedgerProps) {
  return (
    <div
      className="
        rounded-2xl border border-border bg-card p-5 text-text-muted shadow-sm sm:p-6
      "
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-base font-semibold tracking-tight text-text">
          Revenue by source
        </h2>

        <span className="text-xs font-medium text-text-muted">Revenue share</span>
      </div>

      <div className="my-5 h-px w-full bg-border" />

      {children}
      
    </div>
  );
}

export default RevenueLedger;