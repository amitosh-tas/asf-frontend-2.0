import PageLayout from "@/components/layout/PageLayout";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import { StatCardsSkeleton } from "@/components/ui/Skeleton";
import AnalyticsGrid from "@/features/analytics/components/AnalyticsGrid";
import { getPlatformDashboard } from "@/services/platfromAdmin";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getRequestErrorMessage } from "@/features/reports/utils/requestError";
import Button from "@/components/ui/Button";

export interface PlatformAdminDashboard {
  workspaces: {
    total: number;
    pending: number;
    active: number;
    suspended: number;
    closed: number;
  };
  users: {
    total: number;
    platformAdmins: number;
    active: number;
    deactivated: number;
  };
  apiKeys: {
    total: number;
    active: number;
    revoked: number;
  };
  connectors: {
    total: number;
    healthy: number;
    failing: number;
    disabled: number;
  };
  webhooks: {
    total: number;
    active: number;
  };
  auditEvents: number;
}

type ActiveMetric = {
  title: string;
  value: number;
};

function Dashboard() {
  const [dashboardData, setDashboardData] =
    useState<PlatformAdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const callApi = async () => {
      try {
        const res = await getPlatformDashboard();
        if (!cancelled) {
          setDashboardData(res?.data?.data ?? null);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to fetch platform dashboard:", error);
          setDashboardData(null);
          setError(true);
          toast.error(getRequestErrorMessage(error));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void callApi();

    return () => {
      cancelled = true;
    };
  }, [requestVersion]);

  const activeMetrics: ActiveMetric[] = dashboardData
    ? [
      {
        title: "Active Workspaces",
        value: dashboardData.workspaces.active,
      },
      {
        title: "Active Users",
        value: dashboardData.users.active,
      },
      {
        title: "Active API Keys",
        value: dashboardData.apiKeys.active,
      },
      {
        title: "Active Webhooks",
        value: dashboardData.webhooks.active,
      },
    ]
    : [];

  return (
    <PageLayout
      headTitle="Platform"
      title="Super Admin"
      description="Manage Ledger workspaces, members, and platform access."
    >
      {loading ? (
        <StatCardsSkeleton count={4} />
      ) : error ? (
        <div
          role="alert"
          className="rounded-2xl border border-danger/30 bg-danger/5 p-5 text-sm text-danger"
        >
          <p>Unable to load the platform dashboard.</p>
          <Button
            type="button"
            variant="ghost"
            className="mt-3 font-semibold underline underline-offset-2"
            onClick={() => {
              setLoading(true);
              setError(false);
              setDashboardData(null);
              setRequestVersion((version) => version + 1);
            }}
          >
            Try again
          </Button>
        </div>
      ) : dashboardData ? (
        <AnalyticsGrid>
          {activeMetrics.map((item) => (
            <Card
              key={item.title}
              title={item.title}
              value={String(item.value)}
              description="Currently active on the platform"
            />
          ))}
        </AnalyticsGrid>
      ) : (
        <EmptyState
          title="No dashboard data available"
          description="There are no platform statistics to display right now."
        />
      )}
    </PageLayout>
  );
}

export default Dashboard;