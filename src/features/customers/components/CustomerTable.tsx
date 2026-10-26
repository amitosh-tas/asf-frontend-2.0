import DataTable, {
  type DataTableColumn,
} from "@/components/ui/DataTable";
// import Pill from "@/components/ui/Pill";
import { getCustomerJourney } from "@/services/companyServices";
import { useState, type ReactNode } from "react";
import { api } from "@/services/api";
import { channelLabel, listUrl } from "@/services/insights";
import { formatMinorUnits } from "@/features/reports/utils/formatting";
import CustomerJourneyDrawer, { type CustomerJourney, } from "./CustomerJourneyDrawer";


export interface Customer {
  id: string;
  /** Omitted by the backend while a platform admin views with personal data masked. */
  email?: string;
  firstSeenAt: string;
  firstPurchaseAt: string | null;
  lastPurchaseAt: string | null;
  externalIds: Record<string, unknown> | null;
  orders?: number;
  lifetimeRevenueMinorUnits?: string;
  currency?: string | null;
  firstSource?: string | null;
  lastSource?: string | null;
  type?: "new" | "returning" | "prospect";
}

interface CustomerTableProps {
  customers: Customer[];
  /** When provided (company admins only), each row gets a Merge action. */
  onMerge?: (customer: Customer) => void;
  loading: boolean;
  total: number;
  /** set when a platform admin views the company (support session) */
  workspaceId?: string;
  filters?: ReactNode;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    isLoading: boolean;
    onPageChange: (page: number) => void;
  };
}

function formatDate(value: string | null) {
  if (!value) return "—";

  const normalized = value
    .replace(" ", "T")
    .replace(/(\.\d{3})\d+/, "$1")
    .replace(/\+00$/, "Z");
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

// function getExternalIds(externalIds: Customer["externalIds"]) {
//   if (!externalIds) return [];

//   return Object.entries(externalIds)
//     .filter(([, value]) => value !== null && value !== undefined)
//     .map(([provider, value]) => `${provider}: ${String(value)}`);
// }

export default function CustomerTable({
  customers,
  onMerge,
  loading,
  total,
  pagination,
  workspaceId,
  filters,
}: CustomerTableProps) {

  const [journeyData, setJourneyData] =
  useState<CustomerJourney | null>(null);

  const [journeyLoading, setJourneyLoading] = useState(false);
  const [journeyError, setJourneyError] = useState<string | null>(null);

  async function handleClick(id: string) {
    setJourneyLoading(true);
    setJourneyError(null);
    setJourneyData(null);

    try {
      const res = workspaceId ? await api.get(listUrl.journey(id, workspaceId)) : await getCustomerJourney(id);

      // Assumes your service returns the response payload directly.
      setJourneyData(res.data as CustomerJourney);
    } catch (error) {
      console.error("Failed to fetch customer journey:", error);
      setJourneyError("Couldn't load this customer's journey. Please try again.");
    } finally {
      setJourneyLoading(false);
    }
  }

  const columns: DataTableColumn<Customer>[] = [
    {
      key: "email",
      header: "Customer email", 
      render: (customer) => (
        customer.email ? (
          <p className="text-sm text-text-muted">{customer.email}</p>
        ) : (
          <p className="text-sm italic text-text-muted" title="Personal data is masked in this support session">
            Hidden (masked)
          </p>
        )
      ),
    },
    {
      key: "firstSeenAt",
      header: "First seen",
      render: (customer) => (
        <span className="whitespace-nowrap text-xs">
          {formatDate(customer.firstSeenAt)}
        </span>
      ),
    },
    {
      key: "firstPurchaseAt",
      header: "First purchase",
      render: (customer) => (
        <span className="whitespace-nowrap text-xs">
          {formatDate(customer.firstPurchaseAt)}
        </span>
      ),
    },
    {
      key: "lastPurchaseAt",
      header: "Last purchase",
      render: (customer) => (
        <span className="whitespace-nowrap text-xs">
          {formatDate(customer.lastPurchaseAt)}
        </span>
      ),
    },
    {
      key: "orders",
      header: "Orders",
      align: "right",
      render: (customer) => customer.orders ?? "—",
    },
    {
      key: "ltv",
      header: "Lifetime revenue",
      align: "right",
      render: (customer) => (customer.lifetimeRevenueMinorUnits && customer.currency ? formatMinorUnits(customer.lifetimeRevenueMinorUnits, customer.currency) : "—"),
    },
    {
      key: "sources",
      header: "First → last source",
      render: (customer) => (customer.firstSource ? `${channelLabel(customer.firstSource)} → ${channelLabel(customer.lastSource ?? customer.firstSource)}` : "—"),
    },
    {
      key: "journey",
      header: "Journey",
      render: (customer) => (
        <button
          type="button"
          onClick={() => handleClick(customer.id)}
          className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-text transition hover:bg-hover"
        >
          View
        </button>
      ),
    },
    ...(onMerge
      ? [
          {
            key: "merge",
            header: "Duplicates",
            render: (customer: Customer) => (
              <button
                type="button"
                onClick={() => onMerge(customer)}
                className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-text transition hover:bg-hover"
              >
                Merge…
              </button>
            ),
          },
        ]
      : []),
  ];

  
    // {
    //   key: "externalIds",
    //   header: "External IDs",
    //   render: (customer) => {
    //     const externalIds = getExternalIds(customer.externalIds);
    //     return externalIds.length ? (
    //       <div className="flex flex-wrap gap-1.5">
    //         {externalIds.map((externalId) => (
    //           <Pill key={externalId} name={externalId} />
    //         ))}
    //       </div>
    //     ) : (
    //       <span className="text-text-muted">—</span>
    //     );
    //   },
    // },

  return (
    <>
      <DataTable
        tableHead="Customer list"
        tableSubHead={`${total.toLocaleString()} customer${total === 1 ? "" : "s"}`}
        columns={columns}
        data={customers}
        getRowKey={(customer) => customer.id}
        loading={loading}
        filters={filters}
        emptyMessage="No customers found."
        pagination={pagination}
      />
      
      {journeyLoading && (
        <div
          role="status"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 backdrop-blur-sm"
        >
          <div className="rounded-2xl border border-border bg-card px-6 py-5 shadow-xl">
            <p className="text-sm font-semibold text-text">
              Loading customer journey…
            </p>
            <p className="mt-1 text-xs text-text-muted">
              Fetching touchpoints and attribution data
            </p>
          </div>
        </div>
      )}

      {journeyError && !journeyLoading && (
        <div
          role="alert"
          className="fixed bottom-5 right-5 z-60 max-w-sm rounded-xl border border-red-200 bg-card p-4 shadow-lg"
        >
          <p className="text-sm text-text">{journeyError}</p>
          <button
            type="button"
            onClick={() => setJourneyError(null)}
            className="mt-2 text-xs font-semibold text-text underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {journeyData && !journeyLoading && (
        <CustomerJourneyDrawer
          data={journeyData}
          onClose={() => setJourneyData(null)}
        />
      )}
    </>
  );
}
