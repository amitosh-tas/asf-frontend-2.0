import DataChart from "@/components/ui/DataChart";

interface NewCustomersTrendProps {
  data: Array<{ label: string; value: number }>;
  loading: boolean;
  error?: string;
}

export default function NewCustomersTrend({
  data,
  loading,
  error,
}: NewCustomersTrendProps) {
  return (
    <DataChart
      title="New Customers Trend"
      subtitle="by day · company-wide"
      data={data}
      type="bar"
      color="#78876B"
      loading={loading}
      error={error}
    />
  );
}
