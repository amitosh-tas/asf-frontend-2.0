import { useViewWorkspaceId } from "./useReport";

/** "/" for company users, "/super/workspaces/:id/view" for a platform admin viewing a company. */
export function useBasePath() {
  const id = useViewWorkspaceId();
  const base = id ? `/super/workspaces/${id}/view` : "";
  return (path: string) => `${base}${path.startsWith("/") ? path : `/${path}`}` || "/";
}
