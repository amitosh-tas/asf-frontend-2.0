import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, BarChart, Bar } from "recharts";
import { ChartSkeleton } from "@/components/ui/Skeleton";
import { formatReportDate } from "@/features/reports/utils/formatting";

export interface SeriesDef {
  key: string;
  label: string;
  color: string;
  dashed?: boolean;
}

interface TrendChartProps {
  data: Array<Record<string, number | string>>;
  xKey?: string;
  series: SeriesDef[];
  format: (value: number) => string;
  loading?: boolean;
  height?: number;
  type?: "line" | "bar";
}

/** Multi-series chart (e.g. revenue with the previous period overlaid, spend vs revenue). */
export default function TrendChart({ data, xKey = "date", series, format, loading, height = 280, type = "line" }: TrendChartProps) {
  if (loading) return <ChartSkeleton />;
  if (!data.length) return <p className="py-8 text-center text-sm text-text-muted">No data for this period.</p>;
  const Chart = type === "bar" ? BarChart : LineChart;
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <Chart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#eeeeee" vertical={false} />
          <XAxis dataKey={xKey} tickFormatter={(v: string) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? formatReportDate(String(v)) : String(v))} tick={{ fontSize: 11, fill: "#737373" }} tickLine={false} axisLine={false} minTickGap={16} />
          <YAxis tickFormatter={(v: number) => format(v)} tick={{ fontSize: 11, fill: "#737373" }} tickLine={false} axisLine={false} width={84} />
          <Tooltip
            formatter={(value) => format(Number(value ?? 0))}
            labelFormatter={(value) =>
              /^\d{4}-\d{2}-\d{2}$/.test(String(value))
                ? /* your existing date formatting */
                String(value)
                : String(value)
            }
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {series.map((s) =>
            type === "bar" ? (
              <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[3, 3, 0, 0]} />
            ) : (
              <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2} strokeDasharray={s.dashed ? "5 4" : undefined} dot={false} />
            ),
          )}
        </Chart>
      </ResponsiveContainer>
    </div>
  );
}
