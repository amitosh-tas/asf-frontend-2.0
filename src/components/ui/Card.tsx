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
      className="flex min-h-36 min-w-0 flex-col gap-2 rounded-[20px] border border-border/90 bg-card p-5 text-text shadow-[0_8px_24px_-20px_rgba(26,47,31,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-[0_14px_30px_-20px_rgba(26,47,31,0.38)]"
    >
      <p className="text-sm font-medium text-text-muted">
        {title}
      </p>

      <p className="mt-1 wrap-break-word font-heading text-[30px] font-semibold leading-tight tracking-[-0.04em] tabular-nums">
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