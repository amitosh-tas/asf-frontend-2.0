interface ICard {
  title?: string;
  value?: string;
  description?: string;
  trend?: {
    value: string;
    direction: "up" | "down";
  };
}

function Card({
  title,
  value,
  description,
  trend,
}: ICard) {
  return (
    <div
      className="flex min-h-32 min-w-0 flex-col gap-2 rounded-lg border border-border bg-card p-5 text-text shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-md"
    >
      <p className="text-sm font-medium text-text-muted">
        {title}
      </p>

      <p className="mt-1 wrap-break-word font-heading text-2xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>

      {trend ? (
        <p
          className={`text-xs font-medium ${
            trend.direction === "down"
              ? "text-danger"
              : "text-success"
          }`}
        >
          {trend.direction === "down" ? "▼" : "▲"} {trend.value}
        </p>
      ) : (
        <p className="text-xs leading-5 text-text-muted">
          {description}
        </p>
      )}
    </div>
  );
}

export default Card;