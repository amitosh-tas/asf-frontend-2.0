import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import Button from "@/components/ui/Button";
import {
  getCompanyNavigation,
  superAdminNavigation,
} from "@/config/navigation";

interface WorkspaceViewerLocationState {
  workspaceName?: string;
}

function SuperAdminLayout() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const isViewingWorkspace = /^\/super\/workspaces\/[^/]+\/view(?:\/|$)/.test(
    location.pathname,
  );
  const locationState =
    location.state as WorkspaceViewerLocationState | null;
  const viewerBasePath = `/super/workspaces/${id ?? ""}/view`;
  const navigationItems = isViewingWorkspace
    ? getCompanyNavigation("company_viewer").map((item) => ({
        ...item,
        path: item.path === "/" ? viewerBasePath : `${viewerBasePath}${item.path}`,
        end: item.path === "/",
      }))
    : superAdminNavigation;

  return (
    <div className="flex min-h-dvh bg-page-background font-body cursor-default">
      <Sidebar
        companyName={
          isViewingWorkspace
            ? locationState?.workspaceName ?? "COMPANY VIEW"
            : "PLATFORM ADMIN"
        }
        items={navigationItems}
      />

      <main className="min-w-0 flex-1 px-4 pb-8 pt-16 sm:px-6 md:px-10 md:pt-8 xl:px-14">
        {isViewingWorkspace && (
          <div className="mx-auto mb-6 flex w-full max-w-360 flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
            <p className="text-sm font-medium text-text">
              Viewing as a company viewer
              {locationState?.workspaceName
                ? ` for ${locationState.workspaceName}`
                : ""}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate(`/super/workspaces/${id}`)}
            >
              Exit company view
            </Button>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}

export default SuperAdminLayout;