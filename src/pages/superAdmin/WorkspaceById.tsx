import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import PageLayout from "@/components/layout/PageLayout";
import EmptyState from "@/components/ui/EmptyState";
import DataTable, { type DataTableColumn } from "@/components/ui/DataTable";
import Pill from "@/components/ui/Pill";
import StatusPill from "@/components/ui/StatusPill";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { WorkspaceDetailsSkeleton } from "@/components/ui/Skeleton";
import CompanyDetailsFields, {
  type CompanyDetailsValues,
} from "@/components/workspace/CompanyDetailsFields";
import WorkspaceResources, {
  type WorkspaceApiKey,
  type WorkspaceConnector,
} from "@/pages/superAdmin/components/WorkspaceResources";
import {
  addWorkspaceUser,
  deleteUser,
  deleteWorkspace,
  getWorkspaceById,
  revokeKeyAdmin,
  updateUser,
  setWorkspaceStatus,
  updateWorkspace,
  updateWorkspacePlan,
  revokeWorkspacePlan,
  type WorkspaceBillingInterval,
  type WorkspacePlan,
  type WorkspaceWriteData,
} from "@/services/platfromAdmin";
import { getPlatformAdminPlans, type Plan } from "@/services/billingService";
import SupportTools from "@/features/support/components/SupportTools";
import ReasonDialog from "@/components/ui/ReasonDialog";
import toast from "react-hot-toast";
import { getRequestErrorMessage } from "@/features/reports/utils/requestError";

type UserStatus = "active" | "deactivated";

interface WorkspaceUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface WorkspaceUserUpdate {
  role: string;
  status: UserStatus;
  reason: string;
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
  status: string;
  country: string;
  // dataRegion: string;
  defaultModel: string;
  reportingCurrency: string;
  timezone: string;
  consentMode: string;
  lookbackDays: number;
  rawRetentionMonths: number;
  createdAt: string;
  updatedAt: string;
  industry: string | null;
  paymentMethod?: string | null;
  websiteUrl: string | null;
  plan: string | null;
  billingCustomerId?: string | null;
  billingInterval?: WorkspaceBillingInterval | null;
  cancelAtPeriodEnd?: boolean;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  currentPeriodOrderCount?: number;
  monthlyOrderLimit?: number;
  subscriptionStatus?: string | null;
  subscriptionId?: string | null;
  trialEndsAt?: string | null;
  billing?: WorkspaceBilling | null;
}

interface WorkspaceBillingCurrent {
  plan: WorkspacePlan;
  planName: string;
  billingInterval: WorkspaceBillingInterval | null;
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: string | null;
  limits: Record<string, number>;
  features: Record<string, boolean | string[]>;
  usage: {
    ordersUsed: number;
    orderLimit: number;
    percentUsed: number;
    isOverLimit: boolean;
  };
}

interface WorkspaceBilling {
  current: WorkspaceBillingCurrent;
  plans: Plan[];
}

const WORKSPACE_DETAIL_FIELDS: ReadonlyArray<{
  key: Exclude<keyof Workspace, "billing">;
  label: string;
  suffix?: string;
}> = [
    { key: "country", label: "Country" },
    // { key: "dataRegion", label: "Data Region" },
    { key: "reportingCurrency", label: "Reporting Currency" },
    { key: "defaultModel", label: "Default Attribution Model" },
    { key: "lookbackDays", label: "Lookback Window", suffix: "days" },
    {
      key: "rawRetentionMonths",
      label: "Raw Data Retention",
      suffix: "months",
    },
  ];

interface WorkspaceResponse {
  id: string;
  workspace: Workspace;
  users: WorkspaceUser[];
  sites: unknown[];
  locations: unknown[];
  apiKeys: WorkspaceApiKey[];
  connectors: WorkspaceConnector[];
  webhooks: unknown[];
  billing?: WorkspaceBilling | null;
}

function getStatusPillStatus(status: string) {
  switch (status.toLowerCase()) {
    case "active":
      return "ACTIVE";
    // case "invited":
    case "pending":
      return "PENDING";
    case "deactivated":
    case "inactive":
      return "DEACTIVE";
    case "suspended":
      return "SUSPENDED";
    case "ongoing":
      return "ONGOING";
    case "closed":
      return "CLOSED";
    case "open":
      return "OPEN";
    default:
      return null;
  }
}

function isWorkspacePlan(value: string): value is WorkspacePlan {
  return value === "free" || value === "pro" || value === "ultra";
}

function WorkspaceById() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [workspaceData, setWorkspaceData] =
    useState<WorkspaceResponse | null>(null);
  const [planCatalog, setPlanCatalog] = useState<Plan[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingUser, setSavingUser] = useState(false);
  const [revokingApiKeyId, setRevokingApiKeyId] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [userToEdit, setUserToEdit] = useState<WorkspaceUser | null>(null);
  const [userToDeactivate, setUserToDeactivate] =
    useState<WorkspaceUser | null>(null);
  // const [deactivationReason, setDeactivationReason] = useState("");
  const [showAddMember, setShowAddMember] = useState(false);
  const [savingWorkspace, setSavingWorkspace] = useState(false);
  const [deletingWorkspace, setDeletingWorkspace] = useState(false);
  const [dialog, setDialog] = useState<null | "deleteUser" | "deleteWorkspace" | "suspend" | "revokePlan">(null);
  const [editingWorkspace, setEditingWorkspace] = useState(false);
  const [workspaceEditForm, setWorkspaceEditForm] =
    useState<CompanyDetailsValues>({
      name: "",
      country: "",
      industry: "",
      timezone: "",
      // dataRegion: "",
      currency: "",
      // paymentMethod: "",
    });
  const [workspaceFormError, setWorkspaceFormError] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<WorkspacePlan>("pro");
  const [selectedBillingInterval, setSelectedBillingInterval] =
    useState<WorkspaceBillingInterval>("monthly");
  const [planReason, setPlanReason] = useState("");
  const [cancelStripeSubscription, setCancelStripeSubscription] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [showPlanEditor, setShowPlanEditor] = useState(false);
  const [revokeStripeSubscription, setRevokeStripeSubscription] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError("Workspace ID is missing.");
      return;
    }

    let cancelled = false;
    const workspaceId: string = id;

    async function fetchWorkspace() {
      try {
        setLoading(true);
        setError(null);

        const [workspaceResult, plansResult] = await Promise.allSettled([
          getWorkspaceById(workspaceId),
          getPlatformAdminPlans(workspaceId),
        ]);
        if (workspaceResult.status === "rejected") {
          throw workspaceResult.reason;
        }
        const res = workspaceResult.value;
        const result: WorkspaceResponse = res.data.data;

        if (!cancelled) {
          setWorkspaceData(result);
          if (plansResult.status === "fulfilled") {
            setPlanCatalog(plansResult.value);
          } else {
            console.error("Failed to fetch billing plans:", plansResult.reason);
            setPlanCatalog([]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch workspace:", err);

        if (!cancelled) {
          setError("Unable to load workspace details.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchWorkspace();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const refreshWorkspaceData = async () => {
    if (!id) return false;
    try {
      const response = await getWorkspaceById(id);
      const updatedWorkspace: WorkspaceResponse = response.data.data;
      setWorkspaceData(updatedWorkspace);
      return true;
    } catch (refreshError) {
      console.error("Failed to refresh workspace data:", refreshError);
      toast.error(getRequestErrorMessage(refreshError));
      return false;
    }
  };

  // The company's data can only be opened inside a support session; the view route asks for the reason.
  const handleViewAs = () => {
    if (!id || !workspaceData) return;
    navigate(`/super/workspaces/${id}/view`, {
      state: { workspaceName: workspaceData.workspace.name },
    });
  };

  const revokeWorkspaceApiKey = async (apiKey: WorkspaceApiKey) => {
    if (revokingApiKeyId) return false;

    setRevokingApiKeyId(apiKey.id);
    try {
      await revokeKeyAdmin(apiKey.id);
      toast.success("API key revoked successfully.");
      await refreshWorkspaceData();
      return true;
    } catch (revokeError) {
      console.error("Failed to revoke workspace API key:", revokeError);
      toast.error(getRequestErrorMessage(revokeError));
      return false;
    } finally {
      setRevokingApiKeyId(null);
    }
  };

  const saveUser = async (
    user: WorkspaceUser,
    data: WorkspaceUserUpdate,
  ) => {
    if (savingUser) return false;
    setSavingUser(true);
    try {
      await updateUser({ id: user.id, data });
      toast.success("User updated successfully.");
      await refreshWorkspaceData();
      return true;
    } catch (updateError) {
      console.error("Failed to update workspace user:", updateError);
      toast.error(getRequestErrorMessage(updateError));
      return false;
    } finally {
      setSavingUser(false);
    }
  };

  // const deactivateUser = async (user: WorkspaceUser, reason: string) => {
  const deactivateUser = async (user: WorkspaceUser) => {
    // if (savingUser || !reason.trim()) return false;
    if (savingUser) return false;
    setSavingUser(true);
    try {
      await updateUser({
        id: user.id,
        // data: { role: user.role, status: "deactivated", reason: reason.trim() },
        data: { role: user.role, status: "deactivated" },
      });
      toast.success("User deactivated successfully.");
      await refreshWorkspaceData();
      return true;
    } catch (deactivateError) {
      console.error("Failed to deactivate workspace user:", deactivateError);
      toast.error(getRequestErrorMessage(deactivateError));
      return false;
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = () => {
    if (!userToEdit || deletingUser) return;
    setDialog("deleteUser");
  };

  const doDeleteUser = async () => {
    if (!userToEdit || deletingUser) return;
    const user = userToEdit;

    setDeletingUser(true);
    try {
      await deleteUser({ userId: user.id });
      toast.success("User deleted successfully.");
      setUserToEdit(null);
      await refreshWorkspaceData();
    } catch (deleteError) {
      console.error("Failed to delete workspace user:", deleteError);
      toast.error(getRequestErrorMessage(deleteError));
    } finally {
      setDeletingUser(false);
    }
  };

  const saveWorkspace = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id || savingWorkspace) return;
    const formData = new FormData(event.currentTarget);
    const data: WorkspaceWriteData = {
      name: String(formData.get("name")).trim(),
      country: String(formData.get("country")).trim(),
      industry: String(formData.get("industry")).trim(),
      timezone: String(formData.get("timezone")).trim(),
      // dataRegion: String(formData.get("dataRegion")).trim(),
      reportingCurrency: String(formData.get("currency")).trim(),
      paymentMethod: String(formData.get("paymentMethod")).trim(),
      defaultModel: String(formData.get("defaultModel")).trim(),
      lookbackDays: Number(formData.get("lookbackDays")),
      rawRetentionMonths: Number(formData.get("rawRetentionMonths")),
    };
    if (!data.name || !Number.isFinite(data.lookbackDays) ||
      !Number.isFinite(data.rawRetentionMonths)) {
      setWorkspaceFormError("Enter a workspace name and valid retention values.");
      return;
    }
    setSavingWorkspace(true);
    setWorkspaceFormError("");
    try {
      await updateWorkspace({ id, data });
      toast.success("Workspace details updated.");
      setEditingWorkspace(false);
      await refreshWorkspaceData();
    } catch (updateError) {
      console.error("Failed to update workspace details:", updateError);
      setWorkspaceFormError("Unable to save workspace details. Please try again.");
    } finally {
      setSavingWorkspace(false);
    }
  };

  const openWorkspaceEditor = () => {
    if (!workspaceData) return;
    const { workspace } = workspaceData;
    setWorkspaceEditForm({
      name: workspace.name,
      country: workspace.country,
      industry: workspace.industry ?? "",
      timezone: workspace.timezone,
      // dataRegion: workspace.dataRegion,
      currency: workspace.reportingCurrency,
      // paymentMethod: workspace.paymentMethod ?? "",
    });
    setWorkspaceFormError("");
    setEditingWorkspace(true);
  };

  const handleDeleteWorkspace = () => {
    if (!id || !workspaceData || deletingWorkspace || savingWorkspace) return;
    setDialog("deleteWorkspace");
  };

  const doDeleteWorkspace = async (reason: string) => {
    if (!id || !workspaceData || deletingWorkspace || savingWorkspace) return;

    setDeletingWorkspace(true);
    setWorkspaceFormError("");
    try {
      await deleteWorkspace(id, reason);
      toast.success("Workspace deleted successfully.");
      navigate("/super/workspaces", { replace: true });
    } catch (deleteError) {
      console.error("Failed to delete workspace:", deleteError);
      setWorkspaceFormError(getRequestErrorMessage(deleteError));
    } finally {
      setDeletingWorkspace(false);
    }
  };

  const changeWorkspaceStatus = async (reason?: string) => {
    if (!id || !workspaceData || savingWorkspace) return;
    const nextStatus = ["suspended", "pending"].includes(workspaceData.workspace.status.toLowerCase())
      ? "active"
      : "suspended";
    if (nextStatus === "suspended" && !reason) {
      setDialog("suspend");
      return;
    }
    setSavingWorkspace(true);
    try {
      await setWorkspaceStatus(id, nextStatus, reason);
      toast.success(nextStatus === "active" ? "Workspace activated." : "Workspace suspended.");
      await refreshWorkspaceData();
    } catch (updateError) {
      console.error("Failed to update workspace status:", updateError);
      toast.error(getRequestErrorMessage(updateError));
    } finally {
      setSavingWorkspace(false);
    }
  };

  const savePlan = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id || savingPlan || planReason.trim().length < 5) return;

    setSavingPlan(true);
    try {
      await updateWorkspacePlan(id, {
        plan: selectedPlan,
        billingInterval: selectedBillingInterval,
        reason: planReason.trim(),
        cancelStripeSubscription,
      });
      toast.success("Workspace plan updated.");
      setPlanReason("");
      setCancelStripeSubscription(false);
      setShowPlanEditor(false);
      await refreshWorkspaceData();
    } catch (planError) {
      console.error("Failed to update workspace plan:", planError);
      toast.error(getRequestErrorMessage(planError));
    } finally {
      setSavingPlan(false);
    }
  };

  const revokePlan = async (reason: string) => {
    if (!id || savingPlan) return;

    setSavingPlan(true);
    try {
      await revokeWorkspacePlan(id, {
        reason,
        cancelStripeSubscription: revokeStripeSubscription,
      });
      toast.success("Workspace plan revoked.");
      setRevokeStripeSubscription(false);
      await refreshWorkspaceData();
    } catch (revokeError) {
      console.error("Failed to revoke workspace plan:", revokeError);
      toast.error(getRequestErrorMessage(revokeError));
    } finally {
      setSavingPlan(false);
    }
  };

  const createMember = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id || savingUser) return;
    const formData = new FormData(event.currentTarget);
    const data = {
      name: String(formData.get("name")).trim(),
      email: String(formData.get("email")).trim(),
      role: String(formData.get("role")),
      password: String(formData.get("password")).trim(),
    };
    setSavingUser(true);
    try {
      await addWorkspaceUser(id, data);
      toast.success("Workspace member added.");
      setShowAddMember(false);
      await refreshWorkspaceData();
    } catch (createError) {
      console.error("Failed to add workspace member:", createError);
      toast.error(getRequestErrorMessage(createError));
    } finally {
      setSavingUser(false);
    }
  };

  const billing = workspaceData
    ? workspaceData.billing ?? workspaceData.workspace.billing ?? (
      workspaceData.workspace.plan
        ? {
            current: {
              plan: isWorkspacePlan(workspaceData.workspace.plan)
                ? workspaceData.workspace.plan
                : "free",
              planName: planCatalog.find((plan) => plan.tier === workspaceData.workspace.plan)?.name
                ?? workspaceData.workspace.plan,
              billingInterval: workspaceData.workspace.billingInterval ?? null,
              status: workspaceData.workspace.subscriptionStatus ?? "unknown",
              currentPeriodStart: workspaceData.workspace.currentPeriodStart ?? null,
              currentPeriodEnd: workspaceData.workspace.currentPeriodEnd ?? null,
              cancelAtPeriodEnd: workspaceData.workspace.cancelAtPeriodEnd ?? false,
              trialEndsAt: workspaceData.workspace.trialEndsAt ?? null,
              limits: {},
              features: {},
              usage: {
                ordersUsed: workspaceData.workspace.currentPeriodOrderCount ?? 0,
                orderLimit: workspaceData.workspace.monthlyOrderLimit ?? 0,
                percentUsed: workspaceData.workspace.monthlyOrderLimit
                  ? ((workspaceData.workspace.currentPeriodOrderCount ?? 0) / workspaceData.workspace.monthlyOrderLimit) * 100
                  : 0,
                isOverLimit: (workspaceData.workspace.currentPeriodOrderCount ?? 0)
                  > (workspaceData.workspace.monthlyOrderLimit ?? 0),
              },
            },
            plans: planCatalog,
          }
        : null
    )
    : null;

  const userColumns: DataTableColumn<WorkspaceUser>[] = [
    {
      key: "name",
      header: "Name",
      render: (user) => <span className="font-medium">{user.name}</span>,
    },
    {
      key: "email",
      header: "Email",
      render: (user) => <span>{user.email}</span>,
    },
    {
      key: "role",
      header: "Role",
      render: (user) => <Pill name={user.role.replaceAll("_", " ")} />,
    },
    {
      key: "status",
      header: "Status",
      render: (user) => {
        const status = getStatusPillStatus(user.status);
        return status ? (
          <StatusPill status={status} />
        ) : (
          <Pill name={user.status} />
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (user) => (
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => setUserToEdit(user)}
            aria-label={`Edit ${user.name}`}
            variant="outline"
          >
            Edit
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={() => {
              setUserToDeactivate(user);
              // setDeactivationReason("");
            }}
            disabled={user.status.toLowerCase() === "deactivated"}
            aria-label={`Deactivate ${user.name}`}
          >
            Deactivate
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PageLayout
      headTitle={workspaceData?.workspace.name ?? id ?? "Workspace"}
      title="Workspace"
      description="Manage client workspace, edit, and monitor their status."
      actions={
        <div className="flex gap-2 flex-wrap justify-end">
          <Button
            type="button"
            onClick={handleViewAs}
            disabled={loading || !workspaceData}
          >
            View as
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={openWorkspaceEditor}
          >
            Edit details
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={savingWorkspace}
            onClick={() => void changeWorkspaceStatus()}
          >
            {workspaceData?.workspace.status.toLowerCase() === "pending"
              ? "Approve workspace"
              : workspaceData?.workspace.status.toLowerCase() === "suspended"
                ? "Activate workspace"
                : "Suspend workspace"}
          </Button>
        </div>
      }
    >
      {loading ? (
        <WorkspaceDetailsSkeleton />
      ) : error ? (
        <EmptyState
          title="Unable to Load Workspace"
          description={error}
        />
      ) : workspaceData ? (
        <div className="space-y-6">
          {/* Workspace overview */}
          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-text">
                  {workspaceData.workspace.name}
                </h2>

                <p className="mt-1 text-sm text-text-muted">
                  {workspaceData.workspace.slug}
                </p>
              </div>

              {getStatusPillStatus(workspaceData.workspace.status) ? (
                <StatusPill
                  status={getStatusPillStatus(workspaceData.workspace.status)!}
                />
              ) : (
                <Pill name={workspaceData.workspace.status} />
              )}
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {WORKSPACE_DETAIL_FIELDS.map(({ key, label, suffix }) => (
                <div key={key}>
                  <p className="text-sm text-text-muted">{label}</p>
                  <p className="mt-1 font-medium">
                    {workspaceData.workspace[key]}
                    {suffix ? ` ${suffix}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {billing && (
            <section className="rounded-2xl border border-border bg-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-text-muted">Billing</p>
                  <h2 className="mt-1 text-xl font-semibold text-text">
                    {billing.current.planName}
                  </h2>
                  <p className="mt-1 text-sm text-text-muted">
                    {billing.current.status} · {billing.current.billingInterval ?? "No interval"}
                    {billing.current.cancelAtPeriodEnd ? " · Cancels at period end" : ""}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setSelectedPlan(billing.current.plan);
                    setSelectedBillingInterval(billing.current.billingInterval ?? "monthly");
                    setShowPlanEditor(true);
                  }}
                  disabled={savingPlan}
                >
                  Update plan
                </Button>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-sm text-text-muted">Monthly orders</p>
                  <p className="mt-1 font-medium">
                    {billing.current.usage.ordersUsed.toLocaleString()} / {billing.current.usage.orderLimit.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-text-muted">Current period</p>
                  <p className="mt-1 font-medium">
                    {billing.current.currentPeriodEnd ?? "Not scheduled"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-text-muted">Trial ends</p>
                  <p className="mt-1 font-medium">{billing.current.trialEndsAt ?? "Not trialing"}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted">Available plans</p>
                  <p className="mt-1 font-medium">{billing.plans.length}</p>
                </div>
              </div>
              <div className="mt-6 border-t border-border pt-5">
                <p className="text-sm font-medium text-text">Available plans</p>
                {billing.plans.length > 0 ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    {billing.plans.map((plan) => (
                      <div
                        key={plan.id}
                        className={`rounded-lg border p-4 ${
                          plan.tier === billing.current.plan
                            ? "border-primary bg-primary/5"
                            : "border-border"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium">{plan.name}</p>
                          {plan.tier === billing.current.plan && (
                            <Pill name="Current" />
                          )}
                        </div>
                        <p className="mt-2 text-sm text-text-muted">
                          {plan.pricing.monthly?.formatted ?? "Unavailable"} / month
                        </p>
                        <p className="text-sm text-text-muted">
                          {plan.pricing.annually?.formatted ?? "Unavailable"} / year
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-text-muted">
                    No plan catalog was returned by the billing service.
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="mt-5"
                disabled={savingPlan}
                onClick={() => setDialog("revokePlan")}
              >
                Revoke plan
              </Button>
            </section>
          )}

          <DataTable
            tableHead="Workspace Users"
            tableSubHead={`${workspaceData.users.length} user${workspaceData.users.length === 1 ? "" : "s"}`}
            columns={userColumns}
            data={workspaceData.users}
            filters={
              <Button
                type="button"
                size="sm"
                onClick={() => setShowAddMember(true)}
              >
                Add company member
              </Button>
            }
            getRowKey={(user) => user.id}
            emptyMessage="No users found in this workspace."
          />

          {/*
          it was in filters
          <button
                type="button"
                onClick={() => setShowAddMember(true)}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
              >
                Add company member
              </button>
          */}
          <WorkspaceResources
            apiKeys={workspaceData.apiKeys.filter(key => !key.revokedAt)}
            connectors={workspaceData.connectors}
            revokingApiKeyId={revokingApiKeyId}
            onRevokeApiKey={revokeWorkspaceApiKey}
          />

          <SupportTools
            workspaceId={workspaceData.workspace.id}
            slug={workspaceData.workspace.slug}
            apiKeys={workspaceData.apiKeys.filter((key) => !key.revokedAt)}
            onDone={() => void refreshWorkspaceData()}
          />

          {editingWorkspace && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <form
                role="dialog"
                aria-modal="true"
                aria-labelledby="edit-workspace-title"
                onSubmit={(event) => void saveWorkspace(event)}
                className="max-h-[calc(100dvh-2rem)] w-full max-w-3xl space-y-5 overflow-y-auto rounded-2xl border border-border bg-card p-5 sm:p-6"
              >
                <h2 id="edit-workspace-title" className="font-heading text-xl font-semibold">
                  Edit workspace details
                </h2>
                <CompanyDetailsFields
                  values={workspaceEditForm}
                  onChange={(field, value) =>
                    setWorkspaceEditForm((current) => ({
                      ...current,
                      [field]: value,
                    }))
                  }
                />
                {([
                  ["defaultModel", "Default attribution model", workspaceData.workspace.defaultModel],
                  ["lookbackDays", "Lookback window (days)", workspaceData.workspace.lookbackDays],
                  ["rawRetentionMonths", "Raw retention (months)", workspaceData.workspace.rawRetentionMonths],
                ] as const).map(([name, label, value]) => (
                  <label key={name} className="block text-sm font-medium text-text">
                    {label}
                    <input
                      name={name}
                      type={typeof value === "number" ? "number" : "text"}
                      min={typeof value === "number" ? 1 : undefined}
                      required
                      defaultValue={value}
                      className="mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm"
                    />
                  </label>
                ))}
                {workspaceFormError && <p role="alert" className="text-sm text-danger">{workspaceFormError}</p>}
                <div className="flex flex-wrap justify-between gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    size="md"
                    disabled={savingWorkspace || deletingWorkspace}
                    onClick={() => void handleDeleteWorkspace()}
                    loading={deletingWorkspace}
                  >
                    {deletingWorkspace ? "Deleting…" : "Delete workspace"}
                  </Button>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="md"
                      disabled={savingWorkspace || deletingWorkspace}
                      onClick={() => {
                        setEditingWorkspace(false);
                        setWorkspaceFormError("");
                      }}
                    >
                      Cancel
                    </Button>

                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      disabled={savingWorkspace || deletingWorkspace}
                      loading={savingWorkspace}
                    >
                      {savingWorkspace ? "Saving…" : "Save changes"}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {showAddMember && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <form
                role="dialog"
                aria-modal="true"
                aria-labelledby="add-workspace-member-title"
                onSubmit={(event) => void createMember(event)}
                className="w-full max-w-lg rounded-2xl border border-border bg-card p-5 sm:p-6"
              >
                <h2 id="add-workspace-member-title" className="font-heading text-xl font-semibold">
                  Add company member
                </h2>
                <p className="mt-2 text-sm text-text-muted">
                  Add a member to {workspaceData.workspace.name}.
                </p>
                <label className="mt-5 block text-sm font-medium text-text">
                  Full name
                  <input
                    name="name"
                    autoComplete="name"
                    required
                    className="mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm"
                  />
                </label>
                <label className="mt-4 block text-sm font-medium text-text">
                  Email
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm"
                  />
                </label>
                <label className="mt-5 block text-sm font-medium text-text" >
                  Password
                  <Input
                    name="password"
                    type="password"
                    showPasswordToggle
                    required
                  />
                </label>
                <label className="mt-4 block text-sm font-medium text-text">
                  Role
                  <select
                    name="role"
                    defaultValue="company_viewer"
                    className="mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm"
                  >
                    <option value="company_admin">Admin</option>
                    <option value="company_viewer">Viewer</option>
                  </select>
                </label>
                <div className="mt-6 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={savingUser}
                    onClick={() => setShowAddMember(false)}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    variant="primary"
                    disabled={savingUser}
                    loading={savingUser}
                  >
                    {savingUser ? "Adding…" : "Add member"}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {userToEdit && (
            <>
              <div className="bg-black/40 fixed h-full w-full top-0 left-0 z-50"></div>
              <form
                role="dialog"
                aria-modal="true"
                aria-labelledby="edit-workspace-user-title"
                onSubmit={(event) => {
                  event.preventDefault();
                  const formData = new FormData(event.currentTarget);
                  const update: WorkspaceUserUpdate = {
                    role: String(formData.get("role")),
                    status: String(formData.get("status")) as UserStatus,
                    reason: String(formData.get("reason")).trim(),
                  };
                  void saveUser(userToEdit, update).then((saved) => {
                    if (saved) setUserToEdit(null);
                  });
                }}
                className="fixed inset-0 z-60 m-auto h-fit max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-5 sm:p-6"
              >
                <h2
                  id="edit-workspace-user-title"
                  className="font-heading text-xl font-semibold"
                >
                  Edit workspace user
                </h2>
                <p className="mt-2 text-sm text-text-muted">
                  {userToEdit.email}
                </p>
                <label
                  htmlFor="workspace-user-role"
                  className="mt-5 block text-xs font-medium text-text-muted"
                >
                  Role
                </label>
                <select
                  id="workspace-user-role"
                  name="role"
                  defaultValue={userToEdit.role}
                  className="mt-2 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-text"
                >
                  <option value="company_admin">Admin</option>
                  <option value="company_viewer">Viewer</option>
                  <option value="platform_admin">Platform admin</option>
                </select>
                <label
                  htmlFor="workspace-user-status"
                  className="mt-5 block text-xs font-medium text-text-muted"
                >
                  Status
                </label>
                <select
                  id="workspace-user-status"
                  name="status"
                  defaultValue={userToEdit.status}
                  className="mt-2 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm capitalize text-text"
                >
                  {/* <option value="invited">Invited</option> */}
                  <option value="active">Active</option>
                  <option value="deactivated">Deactivated</option>
                </select>
                {/* <label
                htmlFor="workspace-user-reason"
                className="mt-5 block text-xs font-medium text-text-muted"
              >
                Reason
              </label>
              <textarea
                id="workspace-user-reason"
                name="reason"
                required
                rows={3}
                placeholder="Reason for this change"
                className="mt-2 w-full resize-none rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-text"
              /> */}
                <div className="mt-6 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={deletingUser || savingUser}
                    onClick={() => void handleDeleteUser()}
                    loading={deletingUser}
                  >
                    {deletingUser ? "Deleting…" : "Delete"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={savingUser}
                    onClick={() => setUserToEdit(null)}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    variant="primary"
                    disabled={savingUser || deletingUser}
                    loading={savingUser}
                  >
                    {savingUser ? "Saving…" : "Save changes"}
                  </Button>
                </div>
              </form>
            </>
          )}

          {userToDeactivate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="deactivate-workspace-user-title"
                className="w-full max-w-md rounded-xl border border-border bg-card p-5 sm:p-6"
              >
                <h2
                  id="deactivate-workspace-user-title"
                  className="font-heading text-lg font-semibold"
                >
                  Deactivate user?
                </h2>
                <p className="mt-2 text-sm leading-6 text-text-muted">
                  {userToDeactivate.name} will remain in this workspace with a
                  deactivated status.
                </p>
                {/* <label
                  htmlFor="deactivate-user-reason"
                  className="mt-5 block text-xs font-medium text-text-muted"
                >
                  Reason
                </label>
                <textarea
                  id="deactivate-user-reason"
                  required
                  value={deactivationReason}
                  onChange={(event) =>
                    setDeactivationReason(event.target.value)
                  }
                  placeholder="Reason for deactivation"
                  rows={3}
                  className="mt-2 w-full resize-none rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-text"
                /> */}
                <div className="mt-6 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={savingUser}
                    onClick={() => setUserToDeactivate(null)}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    disabled={savingUser}
                    loading={savingUser}
                    onClick={() => {
                      void deactivateUser(
                        userToDeactivate,
                        // deactivationReason,
                      ).then((saved) => {
                        if (saved) setUserToDeactivate(null);
                      });
                    }}
                  >
                    {savingUser ? "Deactivating…" : "Deactivate user"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          title="No Workspace Defined"
          description="Please go back and select a workspace again."
        />
      )}
      {dialog === "deleteUser" && userToEdit && (
        <ReasonDialog
          title={`Delete ${userToEdit.name}?`}
          description={`${userToEdit.email} loses access to this company straight away.`}
          requireReason={false}
          confirmLabel="Delete user"
          destructive
          busy={deletingUser}
          onClose={() => setDialog(null)}
          onConfirm={() => {
            setDialog(null);
            void doDeleteUser();
          }}
        />
      )}
      {dialog === "deleteWorkspace" && workspaceData && (
        <ReasonDialog
          title={`Delete ${workspaceData.workspace.name} and all of its data?`}
          description="Every user, key, visit, customer, order, booking and report row of this company is deleted. This cannot be undone. The deletion is kept in the platform audit log."
          reasonLabel="Reason (kept in the platform audit log)"
          confirmText={workspaceData.workspace.slug}
          confirmLabel="Delete company"
          destructive
          busy={deletingWorkspace}
          onClose={() => setDialog(null)}
          onConfirm={(reason) => {
            setDialog(null);
            void doDeleteWorkspace(reason);
          }}
        />
      )}
      {dialog === "suspend" && workspaceData && (
        <ReasonDialog
          title={`Suspend ${workspaceData.workspace.name}?`}
          description="The company's users cannot sign in and its API keys are refused until you activate it again. Data is kept."
          confirmLabel="Suspend company"
          destructive
          busy={savingWorkspace}
          onClose={() => setDialog(null)}
          onConfirm={(reason) => {
            setDialog(null);
            void changeWorkspaceStatus(reason);
          }}
        />
      )}
      {dialog === "revokePlan" && workspaceData && (
        <ReasonDialog
          title={`Revoke ${workspaceData.workspace.name}'s plan?`}
          description="The workspace plan will be revoked. This action is recorded in the platform audit log."
          reasonLabel="Reason (kept in the platform audit log)"
          confirmLabel="Revoke plan"
          destructive
          busy={savingPlan}
          additionalFields={
            <label className="flex items-center gap-2 text-sm text-text">
              <input
                type="checkbox"
                checked={revokeStripeSubscription}
                onChange={(event) => setRevokeStripeSubscription(event.target.checked)}
              />
              Cancel the Stripe subscription
            </label>
          }
          onClose={() => {
            setDialog(null);
            setRevokeStripeSubscription(false);
          }}
          onConfirm={(reason) => {
            setDialog(null);
            void revokePlan(reason);
          }}
        />
      )}
      {showPlanEditor && billing && (
        <Modal
          open
          title="Update workspace plan"
          description="Changes are recorded in the platform audit log."
          onClose={() => setShowPlanEditor(false)}
        >
          <form className="space-y-5" onSubmit={(event) => void savePlan(event)}>
            <label className="block text-sm font-medium text-text">
              Plan
              <select
                value={selectedPlan}
                onChange={(event) => setSelectedPlan(event.target.value as WorkspacePlan)}
                className="mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm"
              >
                {billing.plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>{plan.name}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-text">
              Billing interval
              <select
                value={selectedBillingInterval}
                onChange={(event) => setSelectedBillingInterval(event.target.value as WorkspaceBillingInterval)}
                className="mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm"
              >
                <option value="monthly">Monthly</option>
                <option value="annually">Annually</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-text">
              Reason
              <Input
                value={planReason}
                onChange={(event) => setPlanReason(event.target.value)}
                placeholder="Reason for this plan change"
                required
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-text">
              <input
                type="checkbox"
                checked={cancelStripeSubscription}
                onChange={(event) => setCancelStripeSubscription(event.target.checked)}
              />
              Cancel the Stripe subscription
            </label>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowPlanEditor(false)} disabled={savingPlan}>
                Cancel
              </Button>
              <Button type="submit" loading={savingPlan} disabled={savingPlan || planReason.trim().length < 5}>
                Save plan
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </PageLayout>
  );
}

export default WorkspaceById;