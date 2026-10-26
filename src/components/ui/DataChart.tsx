import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { ChartSkeleton } from "@/components/ui/Skeleton";

interface ChartData {
  label: string;
  value: number;
}

interface IDataChart {
  title: string;
  subtitle?: string;
  data: ChartData[];
  type?: "line" | "bar";
  color?: string;
  valuePrefix?: string;
  valueSuffix?: string;
  valueFormatter?: (value: number) => string;
  actionLabel?: string;
  onAction?: () => void;
  height?: number;
  loading?: boolean;
  error?: string;
}

function DataChart({
  title,
  subtitle,
  data,
  type = "line",
  color = "#111111",
  valuePrefix = "",
  valueSuffix = "",
  valueFormatter,
  actionLabel,
  onAction,
  height = 260,
  loading = false,
  error,
}: IDataChart) {
  const formatValue = (value: number) =>
    valueFormatter?.(value) ??
    `${valuePrefix}${value.toLocaleString()}${valueSuffix}`;

  if (loading) return <ChartSkeleton />;

  return (
    <section className="w-full min-w-0 rounded-lg border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
        <h2 className="font-heading text-base font-semibold tracking-tight text-text">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-xs text-text-muted">
            {subtitle}
          </p>
        )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {actionLabel && (
            <button
            type="button"
            onClick={onAction}
            className="cursor-pointer rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text transition hover:bg-hover"
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>

      {error ? (
        <p role="alert" className="flex items-center text-sm text-danger" style={{ height }}>
          {error}
        </p>
      ) : data.length === 0 ? (
        <p className="flex items-center text-sm text-text-muted" style={{ height }}>
          No chart data available for this period.
        </p>
      ) : (
        <div style={{ width: "100%", height }}>
          <ResponsiveContainer width="100%" height="100%">
            {type === "bar" ? (
              <BarChart
                data={data}
                margin={{ top: 8, right: 4, left: 4, bottom: 0 }}
              >
                <CartesianGrid vertical={false} stroke="#e5e5e5" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#737373" }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                />
                <YAxis hide />
                <Tooltip
                  formatter={(value) => formatValue(Number(value))}
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid #e5e5e5",
                    fontSize: 12,
                    color: "#171717",
                  }}
                />
                <Bar
                  dataKey="value"
                  fill={color}
                  radius={[2, 2, 0, 0]}
                  maxBarSize={18}
                />
              </BarChart>
            ) : (
              <LineChart
                data={data}
                margin={{ top: 8, right: 4, left: 4, bottom: 0 }}
              >
                <CartesianGrid vertical={false} stroke="#e5e5e5" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#737373" }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                />
                <YAxis hide />
                <Tooltip
                  formatter={(value) => formatValue(Number(value))}
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid #e5e5e5",
                    fontSize: 12,
                    color: "#171717",
                  }}
                />
                <Line
                  type="linear"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: color, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

export default DataChart;