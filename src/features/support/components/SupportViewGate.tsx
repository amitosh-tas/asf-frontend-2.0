import { Navigate, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { useSupportSession } from "../hooks/useSupportSession";
import StartSupportSessionModal from "./StartSupportSessionModal";
import SupportSessionBanner from "./SupportSessionBanner";

/**
 * Route element for /super/workspaces/:id/view/*.
 * The company pages are only rendered while the admin has a live support session, so they never fire
 * requests the backend would refuse. When the session ends or expires the admin is asked for a new one.
 */
export default function SupportViewGate() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const session = useSupportSession(id);
  const workspaceName = (location.state as { workspaceName?: string } | null)?.workspaceName;

  if (!id) return <Navigate to="/super/workspaces" replace />;

  const backToWorkspace = () => navigate(`/super/workspaces/${id}`, { replace: true });

  if (!session) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6 text-center text-sm text-text-muted">
        <p>A support session is required to view this company&apos;s data.</p>
        <StartSupportSessionModal
          workspaceId={id}
          workspaceName={workspaceName}
          onStarted={() => {
            /* the hook re-renders as soon as the session is stored */
          }}
          onCancel={backToWorkspace}
        />
      </div>
    );
  }

  return (
    <>
      <SupportSessionBanner session={session} workspaceName={workspaceName} onEnded={backToWorkspace} />
      <Outlet />
    </>
  );
}
