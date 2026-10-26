import DataTable, {
  type DataTableColumn,
} from "@/components/ui/DataTable";
import Pill from "@/components/ui/Pill";
import { formatMinorUnits } from "@/features/reports/utils/formatting";
import type { WorkspaceDashboard } from "@/services/companyServices";

type PlatformRevenue = WorkspaceDashboard["revenueByPlatform"][number];

interface RevenueByPlatformProps {
  data: PlatformRevenue[];
  currency?: string;
  loading: boolean;
  error?: string;
}

export default function RevenueByPlatform({
  data,
  currency,
  loading,
  error,
}: RevenueByPlatformProps) {
  const columns: DataTableColumn<PlatformRevenue>[] = [
    {
      key: "platform",
      header: "Platform",
      render: (row) => <Pill name={row.platform} />,
    },
    {
      key: "conversions",
      header: "Conversions",
      align: "right",
      render: (row) => row.conversions.toLocaleString(),
    },
    {
      key: "revenue",
      header: "Revenue",
      align: "right",
      render: (row) => (
        <span className="tabular-nums">
          {currency
            ? formatMinorUnits(row.revenueMinorUnits, currency)
            : "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <DataTable
        tableHead="Revenue by Platform"
        tableSubHead="All locations · sent conversions only"
        columns={columns}
        data={data}
        getRowKey={(row) => row.platform}
        loading={loading}
        emptyMessage="No platform revenue found."
      />
    </div>
  );
}
