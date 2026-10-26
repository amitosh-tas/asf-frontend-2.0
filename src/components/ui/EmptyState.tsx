interface EmptyStateProps {
  title: string;
  description: string;
}

export default function EmptyState({
  title,
  description,
}: EmptyStateProps) {
  return (
    <section className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-border bg-card px-6 py-12 text-center shadow-sm">
      <h2 className="font-heading text-base font-semibold tracking-tight text-text">
        {title}
      </h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-text-muted">
        {description}
      </p>
    </section>
  );
}
