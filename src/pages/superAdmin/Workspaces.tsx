import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import PageLayout from "@/components/layout/PageLayout";
import DataTable from "@/components/ui/DataTable";
import type { DataTableColumn } from "@/components/ui/DataTable";
import Pill from "@/components/ui/Pill";
import StatusPill from "@/components/ui/StatusPill";
import CompanyDetailsFields, {
  type CompanyDetailsValues,
} from "@/components/workspace/CompanyDetailsFields";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import ReasonDialog from "@/components/ui/ReasonDialog";

import {
  createCompanyWorkspace,
  getWorkspaces,
  setWorkspaceStatus,
} from "@/services/platfromAdmin";
import { passwordProblem } from "@/features/auth/passwordPolicy";
import { formatDateTime, formatNumber } from "@/features/reports/utils/formatting";
import toast from "react-hot-toast";
import { getRequestErrorMessage } from "@/features/reports/utils/requestError";

interface WorkspacePagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface WorkspacesResponse {
  data: Workspace[];
  pagination: WorkspacePagination;
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
  country: string;
  industry: string | null;
  status: WorkspaceStatus;
  reportingCurrency?: string | null;
  currency?: string | null;
  createdAt: string;
  emailVerified?: boolean;
  eventsPerDay?: number;
  lastEventAt?: string | null;
  integrationHealth?: "healthy" | "pending" | "failing" | "none";
  connectors?: number;
}

type WorkspaceStatus = "pending" | "active" | "suspended" | "closed";

const WORKSPACE_STATUSES: ReadonlyArray<{
  value: WorkspaceStatus;
  label: string;
}> = [
    { value: "active", label: "Active" },
    { value: "pending", label: "Pending approval" },
    { value: "suspended", label: "Suspended" },
    { value: "closed", label: "Closed" },
  ];

interface AddCompanyForm extends CompanyDetailsValues {
  adminName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const EMPTY_COMPANY: AddCompanyForm = {
  adminName: "",
  email: "",
  password: "",
  confirmPassword: "",
  name: "",
  country: "IN",
  industry: "",
  timezone: "Asia/Kolkata",
  dataRegion: "IN",
  currency: "INR",
  // paymentMethod: "",
};

function formatDate(value: string) {
  const normalized = value
    .replace(" ", "T")
    .replace(/(\.\d{3})\d+/, "$1")
    .replace(/\+00$/, "Z");

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getWorkspaceCurrency(workspace: Workspace) {
  return workspace.reportingCurrency || workspace.currency || "—";
}

function Workspaces() {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    pages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingWorkspace, setAddingWorkspace] = useState(false);
  const [addCompanyError, setAddCompanyError] = useState("");
  const [savingWorkspaceId, setSavingWorkspaceId] = useState<string | null>(null);
  const [companyForm, setCompanyForm] = useState<AddCompanyForm>(EMPTY_COMPANY);
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [statusChange, setStatusChange] = useState<{ workspace: Workspace; status: WorkspaceStatus } | null>(null);

  const handleWorkspaceClick = (workspace: Workspace) => {
    navigate(`/super/workspaces/${workspace.id}`);
  };

  const loadWorkspaces = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getWorkspaces(page);
      const result: WorkspacesResponse = response.data;
      setWorkspaces(result.data);
      setPagination(result.pagination);
    } catch (fetchError) {
      console.error("Failed to fetch workspaces:", fetchError);
      setError("Unable to load workspaces.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getWorkspaces(page);
        if (cancelled) return;
        const result: WorkspacesResponse = response.data;
        setWorkspaces(result.data);
        setPagination(result.pagination);
      } catch (fetchError) {
        if (cancelled) return;
        console.error("Failed to fetch workspaces:", fetchError);
        setError("Unable to load workspaces.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void fetch();
    return () => {
      cancelled = true;
    };
  }, [page]);

  const handleCreateWorkspace = async (
    event: React.SubmitEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (addingWorkspace) return;
    setAddCompanyError("");
    const weak = passwordProblem(companyForm.password, companyForm.email);
    if (weak) {
      setAddCompanyError(weak);
      return;
    }
    if (companyForm.password !== companyForm.confirmPassword) {
      setAddCompanyError("Passwords do not match.");
      return;
    }
    setAddingWorkspace(true);
    try {
      // Created by a platform admin: active straight away, no email confirmation needed.
      await createCompanyWorkspace({
        name: companyForm.name.trim(),
        country: companyForm.country,
        industry: companyForm.industry || undefined,
        timezone: companyForm.timezone || undefined,
        currency: companyForm.currency || undefined,
        admin: { name: companyForm.adminName.trim(), email: companyForm.email.trim(), password: companyForm.password },
      });
      toast.success("Company workspace created.");
      setCompanyForm(EMPTY_COMPANY);
      setShowAddCompany(false);
      setAddCompanyError("");
      await loadWorkspaces();
    } catch (createError) {
      setAddCompanyError(getRequestErrorMessage(createError));
    } finally {
      setAddingWorkspace(false);
    }
  };

  const updateWorkspaceStatus = async (
    workspace: Workspace,
    status: WorkspaceStatus,
    reason?: string,
  ) => {
    if (workspace.status === status) return;
    if ((status === "suspended" || status === "closed") && !reason) {
      setStatusChange({ workspace, status });
      return;
    }
    setSavingWorkspaceId(workspace.id);
    try {
      await setWorkspaceStatus(workspace.id, status, reason);
      toast.success(workspace.status === "pending" && status === "active" ? `${workspace.name} approved.` : `Workspace status changed to ${status}.`);
      await loadWorkspaces();
    } catch (updateError) {
      console.error("Failed to update workspace status:", updateError);
      toast.error(getRequestErrorMessage(updateError));
    } finally {
      setSavingWorkspaceId(null);
    }
  };

  const columns: DataTableColumn<Workspace>[] = [
    {
      key: "name",
      header: "Workspace",
      render: (row) => (
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-text">{row.name}</span>
          <span className="text-xs text-text-muted">{row.slug}</span>
        </div>
      ),
    },
    {
      key: "country",
      header: "Country",
      render: (row) => row.country,
    },
    {
      key: "industry",
      header: "Industry",
      render: (row) => (
        <Pill name={row.industry ?? "Unspecified"} />
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <div className="flex flex-col gap-1">
          {row.status === "pending" ? <Pill name="pending approval" /> : <StatusPill status={row.status.toUpperCase() as "ACTIVE" | "SUSPENDED" | "CLOSED"} />}
          {row.emailVerified === false && <span className="text-xs text-text-muted">email not confirmed</span>}
        </div>
      ),
    },
    {
      key: "activity",
      header: "Events / day",
      align: "right",
      render: (row) => (
        <div className="flex flex-col items-end gap-0.5">
          <span>{formatNumber(row.eventsPerDay, 1)}</span>
          <span className="text-xs text-text-muted">{row.lastEventAt ? `last ${formatDateTime(row.lastEventAt)}` : "no events yet"}</span>
        </div>
      ),
    },
    {
      key: "health",
      header: "Integrations",
      render: (row) => (
        <span className={row.integrationHealth === "failing" ? "text-sm font-medium text-danger" : "text-sm text-text-muted"}>
          {row.integrationHealth === "none" || !row.integrationHealth ? "none" : `${row.connectors ?? 0} · ${row.integrationHealth}`}
        </span>
      ),
    },
    {
      key: "currency",
      header: "Currency",
      render: (row) => getWorkspaceCurrency(row),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (row) => (
        <div className="flex justify-end gap-2">
          {/* <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              handleWorkspaceClick(row);
            }}
            className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-surface-muted"
          >
            Edit
          </button> */}
          {row.status === "pending" && (
            <Button
              type="button"
              size="sm"
              disabled={savingWorkspaceId === row.id || row.emailVerified === false}
              title={row.emailVerified === false ? "The company has not confirmed its email yet" : undefined}
              onClick={(event) => {
                event.stopPropagation();
                void updateWorkspaceStatus(row, "active");
              }}
            >
              Approve
            </Button>
          )}
          <Select
            aria-label={`Change status for ${row.name}`}
            value={row.status}
            disabled={savingWorkspaceId === row.id}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => {
              event.stopPropagation();
              void updateWorkspaceStatus(
                row,
                event.target.value as WorkspaceStatus,
              );
            }}
            className="h-8 rounded-md px-2.5 py-1.5 text-xs font-medium"
          >
            {WORKSPACE_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </Select>
          {savingWorkspaceId === row.id && (
            <span role="status" className="self-center text-xs text-text-muted">
              Saving…
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <PageLayout
      headTitle="Workspaces"
      title="Workspaces"
      description="Manage client workspaces, review registrations, and monitor their status."
      actions={
        <Button
          type="button"
          onClick={() => setShowAddCompany(true)}
        >
          Add company
        </Button>
      }
    >
      {error ? (
        <div className="rounded-2xl border border-danger/30 bg-danger/5 p-5 text-sm text-danger">
          <p>{error}</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-3 font-semibold underline"
            onClick={() => window.location.reload()}
          >
            Try again
          </Button>
        </div>
      ) : (
        <DataTable
          tableHead="All workspaces"
          tableSubHead={`${pagination.total} workspaces`}
          columns={columns}
          data={workspaces}
          getRowKey={(row) => row.id}
          onRowClick={handleWorkspaceClick}
          loading={loading}
          emptyMessage="No workspaces found."
          pagination={{
            ...pagination,
            isLoading: loading,
            onPageChange: setPage,
          }}
        />
      )}

      {showAddCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-company-title"
            onSubmit={(event) => void handleCreateWorkspace(event)}
            className="max-h-[calc(100dvh-2rem)] w-full max-w-3xl space-y-6 overflow-y-auto rounded-2xl border border-border bg-card p-5 sm:p-6"
          >
            <div>
              <h2
                id="add-company-title"
                className="font-heading text-xl font-semibold"
              >
                Add company
              </h2>
              <p className="mt-2 text-sm text-text-muted">
                Create a company workspace and its initial administrator account.
              </p>
            </div>
            <section className="flex flex-col gap-5">
              <div>
                <h3 className="font-heading text-base font-semibold tracking-tight text-text">
                  Account details
                </h3>
                <p className="mt-1 text-sm leading-6 text-text-muted">
                  Set up the company administrator's login.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-text">
                  Full name *
                  <Input
                    name="adminName"
                    autoComplete="name"
                    required
                    value={companyForm.adminName}
                    onChange={(event) =>
                      setCompanyForm((current) => ({
                        ...current,
                        adminName: event.target.value,
                      }))
                    }
                    placeholder="Administrator's full name"
                    className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-text">
                  Work email *
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={companyForm.email}
                    onChange={(event) =>
                      setCompanyForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    placeholder="admin@company.com"
                    className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-text">
                  Password *
                  <Input
                    name="password"
                    type="password"
                    showPasswordToggle
                    autoComplete="new-password"
                    minLength={8}
                    required
                    value={companyForm.password}
                    onChange={(event) =>
                      setCompanyForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    placeholder="Minimum 8 characters"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-text">
                  Confirm password *
                  <Input
                    name="confirmPassword"
                    type="password"
                    showPasswordToggle
                    autoComplete="new-password"
                    minLength={8}
                    required
                    value={companyForm.confirmPassword}
                    onChange={(event) =>
                      setCompanyForm((current) => ({
                        ...current,
                        confirmPassword: event.target.value,
                      }))
                    }
                    placeholder="Repeat the password"
                  />
                </label>
              </div>
            </section>
            <div className="h-px bg-border" />
            <CompanyDetailsFields
              values={companyForm}
              onChange={(field, value) =>
                setCompanyForm((current) => ({ ...current, [field]: value }))
              }
            />
            {addCompanyError && (
              <p role="alert" className="text-sm text-danger">
                {addCompanyError}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={addingWorkspace}
                onClick={() => {
                  setShowAddCompany(false);
                  setCompanyForm(EMPTY_COMPANY);
                  setAddCompanyError("");
                }}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="primary"
                disabled={addingWorkspace}
                loading={addingWorkspace}
              >
                {addingWorkspace ? "Creating…" : "Create company"}
              </Button>
            </div>
          </form>
        </div>
      )}
      {statusChange && (
        <ReasonDialog
          title={`${statusChange.status === "closed" ? "Close" : "Suspend"} ${statusChange.workspace.name}?`}
          description={statusChange.status === "closed" ? "Nobody at the company can sign in and its keys stop working. Data is kept." : "The company's users cannot sign in and its keys are refused until you activate it again. Data is kept."}
          confirmLabel={statusChange.status === "closed" ? "Close company" : "Suspend company"}
          destructive
          busy={savingWorkspaceId === statusChange.workspace.id}
          onClose={() => setStatusChange(null)}
          onConfirm={(reason) => {
            const { workspace, status } = statusChange;
            setStatusChange(null);
            void updateWorkspaceStatus(workspace, status, reason);
          }}
        />
      )}
    </PageLayout>
  );
}

export default Workspaces;