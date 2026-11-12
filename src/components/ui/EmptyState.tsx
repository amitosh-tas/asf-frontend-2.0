import { ChartNoAxesCombined } from "lucide-react";
interface EmptyStateProps {
  title: string;
  description: string;
}

export default function EmptyState({
  title,
  description,
}: EmptyStateProps) {
  return (
    <section className="flex min-h-64 flex-col items-center justify-center rounded-[22px] border border-border bg-card px-6 py-12 text-center shadow-[0_12px_34px_-26px_rgba(26,47,31,0.35)]">
      <span aria-hidden="true" className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-active text-chart-1"><ChartNoAxesCombined size={21} strokeWidth={1.8} /></span>
      <h2 className="font-heading text-lg font-semibold tracking-[-0.025em] text-text">
        {title}
      </h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-text-muted">
        {description}
      </p>
    </section>
  );
}
