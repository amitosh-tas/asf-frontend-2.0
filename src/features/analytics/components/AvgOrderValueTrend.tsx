import DataChart from "@/components/ui/DataChart";
import { formatCurrency } from "@/features/reports/utils/formatting";

interface AvgOrderValueTrendProps {
  data: Array<{ label: string; value: number }>;
  currency?: string;
  loading: boolean;
  error?: string;
}

export default function AvgOrderValueTrend({
  data,
  currency,
  loading,
  error,
}: AvgOrderValueTrendProps) {
  return (
    <DataChart
      title="Avg Order Value Trend"
      subtitle="by day"
      data={data}
      type="line"
      color="#111111"
      valueFormatter={
        currency ? (value) => formatCurrency(value, currency) : undefined
      }
      loading={loading}
      error={error}
    />
  );
}
