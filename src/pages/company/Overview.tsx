import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Card from "@/components/ui/Card";
import PageLayout from "@/components/layout/PageLayout";
import { StatCardsSkeleton } from "@/components/ui/Skeleton";
import Analytics from "@/features/analytics/components/Analytics";
import AnalyticsGrid from "@/features/analytics/components/AnalyticsGrid";
import RevenueByPlatform from "@/features/revenue/components/RevenueByPlatform";
import RevenueLedger from "@/features/revenue/components/RevenueLedger";
import RevenueLedgerChart from "@/features/revenue/components/RevenueLedgerChart";
import { formatMajorUnits } from "@/features/reports/utils/formatting";
import { getRequestErrorMessage } from "@/features/reports/utils/requestError";
import toast from "react-hot-toast";
import {
  getWorkspaceDashboard,
  type WorkspaceDashboard,
} from "@/services/companyServices";
import { viewDashboard } from "@/services/viewonlyService";

interface DashboardResult {
  workspaceId?: string;
  dashboard?: WorkspaceDashboard;
  error?: string;
}

function Overview() {
  const { id: workspaceId } = useParams<{ id: string }>();
  const [result, setResult] = useState<DashboardResult>();
  const currentResult =
    result?.workspaceId === workspaceId ? result : undefined;
  const dashboard = currentResult?.dashboard;
  const error = currentResult?.error;
  const loading = currentResult === undefined;

  useEffect(() => {
    let cancelled = false;
    const request = workspaceId
      ? viewDashboard(workspaceId)
      : getWorkspaceDashboard();

    void request.then(
      (response) => {
        if (cancelled) return;
        setResult({ workspaceId, dashboard: response.data });
      },
      (requestError: unknown) => {
        if (cancelled) return;
        const message = getRequestErrorMessage(requestError);
        setResult({ workspaceId, error: message });
        toast.error(message);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  const dashboardCards = dashboard
    ? [
        {
          title: "New Customers",
          value: dashboard.kpis.newCustomers.value.toLocaleString(),
          description: dashboard.kpis.newCustomers.label,
        },
        {
          title: "Returning Customers",
          value: dashboard.kpis.returningCustomers.value.toLocaleString(),
          description: dashboard.kpis.returningCustomers.label,
        },
        {
          title: "Retention",
          value: `${dashboard.kpis.retention.percentage}%`,
          description: dashboard.kpis.retention.detail,
        },
        {
          title: "Tracked Visits",
          value: dashboard.kpis.trackedVisits.value.toLocaleString(),
          description: dashboard.kpis.trackedVisits.label,
        },
        {
          title: "Ad-Attributed Revenue",
          value: formatMajorUnits(
            dashboard.revenueCards.adAttributed.value,
            dashboard.currency,
          ),
          description: dashboard.revenueCards.adAttributed.subtext,
        },
        {
          title: "Direct / Organic Revenue",
          value: formatMajorUnits(
            dashboard.revenueCards.directOrganic.value,
            dashboard.currency,
          ),
          description: dashboard.revenueCards.directOrganic.subtext,
        },
        {
          title: "Unattributed Revenue",
          value: formatMajorUnits(
            dashboard.revenueCards.unattributed.value,
            dashboard.currency,
          ),
          description: dashboard.revenueCards.unattributed.subtext,
        },
        {
          title: "Refunded",
          value: formatMajorUnits(
            dashboard.revenueCards.refunded.value,
            dashboard.currency,
          ),
          description: dashboard.revenueCards.refunded.subtext,
        },
        {
          title: "Avg Order Value",
          value: formatMajorUnits(
            dashboard.revenueCards.avgOrderValue.value,
            dashboard.currency,
          ),
          description: dashboard.revenueCards.avgOrderValue.subtext,
        },
      ]
    : [];

  return (
    <PageLayout
      headTitle=""
      title="Company Dashboard"
      description="Company performance from your dashboard data."
    >
      {error && (
        <p role="alert" className="text-sm text-danger">
          Unable to load workspace dashboard: {error}
        </p>
      )}

      <Analytics
        loading={loading}
        revenue={dashboard?.primaryRevenue.totalRevenue}
        exclTax={dashboard?.primaryRevenue.exclTax}
        tax={dashboard?.primaryRevenue.tax}
        invoices={dashboard?.primaryRevenue.invoicesCount}
        currency={dashboard?.currency}
        description={dashboard?.primaryRevenue.description}
      />

      {loading ? (
        <StatCardsSkeleton count={9} />
      ) : (
        dashboardCards.length > 0 && (
          <AnalyticsGrid>
            {dashboardCards.map(({ title, value, description }) => (
              <Card
                key={title}
                title={title}
                value={value}
                description={description}
              />
            ))}
          </AnalyticsGrid>
        )
      )}

      <RevenueLedger>
        <RevenueLedgerChart
          data={dashboard?.revenueBySource ?? []}
          loading={loading}
        />
      </RevenueLedger>

      <RevenueByPlatform
        data={dashboard?.revenueByPlatform ?? []}
        currency={dashboard?.currency}
        loading={loading}
        error={error}
      />
    </PageLayout>
  );
}

export default Overview;
