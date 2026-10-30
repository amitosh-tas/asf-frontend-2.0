import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/Skeleton";

interface KpiProps {
  label: string;
  value: ReactNode;
  /** % change vs the previous period (null = nothing to compare) */
  change?: number | null;
  /** for metrics where a rise is bad (CAC, refunds, cancellation rate) */
  inverse?: boolean;
  hint?: ReactNode;
  loading?: boolean;
  onClick?: () => void;
}

export function Kpi({ label, value, change, inverse = false, hint, loading, onClick }: KpiProps) {
  const good = change === null || change === undefined ? null : inverse ? change <= 0 : change >= 0;
  const className = `group flex min-h-32 min-w-0 flex-col gap-2 rounded-2xl border border-border/80 bg-card p-5 text-left shadow-[0_2px_10px_rgba(15,23,42,0.025)] transition duration-200 ${onClick ? "cursor-pointer hover:-translate-y-0.5 hover:border-border hover:shadow-[0_10px_28px_rgba(15,23,42,0.08)]" : ""}`;
  const body = (
    <>
      <span className="text-[12px] font-medium tracking-[0.01em] text-text-muted">{label}</span>
      {loading ? <Skeleton className="h-8 w-2/3" /> : <span className="font-heading text-[28px] font-semibold tabular-nums tracking-[-0.04em] text-text">{value}</span>}
      {!loading && change !== undefined && (
        <span className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${good === null ? "bg-surface-muted text-text-muted" : good ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
          {change === null ? "No previous period" : `${change >= 0 ? "↑" : "↓"} ${Math.abs(change)}%`}
        </span>
      )}
      {!loading && hint && <span className="text-xs leading-5 text-text-muted">{hint}</span>}
    </>
  );
  return onClick ? (
    <button type="button" onClick={onClick} className={className}>
      {body}
    </button>
  ) : (
    <div className={className}>{body}</div>
  );
}

export function KpiGrid({ children }: { children: ReactNode }) {
  return <div className="mb-1 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{children}</div>;
}

export function Section({ title, subtitle, actions, children }: { title: string; subtitle?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="mb-1 w-full min-w-0 rounded-2xl border border-border/80 bg-card p-5 shadow-[0_2px_10px_rgba(15,23,42,0.025)] sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-[15px] font-semibold tracking-tight text-text">{title}</h2>
          {subtitle && <p className="mt-1 text-xs text-text-muted">{subtitle}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

/** Horizontal share bars (ledger bar / breakdowns). */
export function ShareBars({ rows, format }: { rows: { label: string; value: number; color?: string; detail?: string }[]; format: (v: number) => string }) {
  const total = rows.reduce((s, r) => s + Math.max(0, r.value), 0) || 1;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface-muted" aria-hidden="true">
        {rows.filter((r) => r.value > 0).map((r) => (
          <span key={r.label} style={{ width: `${(r.value / total) * 100}%`, background: r.color ?? "var(--color-chart-1)" }} />
        ))}
      </div>
      <ul className="flex flex-col gap-2">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: r.color ?? "var(--color-chart-1)" }} />
              <span className="truncate text-text">{r.label}</span>
              {r.detail && <span className="text-xs text-text-muted">{r.detail}</span>}
            </span>
            <span className="shrink-0 tabular-nums text-text">
              {format(r.value)} <span className="text-xs text-text-muted">({((Math.max(0, r.value) / total) * 100).toFixed(1)}%)</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Warnings({ warnings }: { warnings?: string[] }) {
  if (!warnings?.length) return null;
  return (
    <div role="status" className="mb-6 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
      {warnings.map((w) => (
        <p key={w}>{w}</p>
      ))}
    </div>
  );
}

export function ErrorBox({ error, onRetry }: { error?: string; onRetry?: () => void }) {
  if (!error) return null;
  return (
    <div role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
      <span>{error}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="font-medium underline">
          Retry
        </button>
      )}
    </div>
  );
}
