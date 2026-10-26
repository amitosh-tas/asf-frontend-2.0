import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import DataTable, {
  type DataTableColumn,
} from "@/components/ui/DataTable";
// import InviteCard from "@/components/ui/InviteCard";
import PageLayout from "@/components/layout/PageLayout";
import Pill from "@/components/ui/Pill";
import StatusPill from "@/components/ui/StatusPill";
import { useAppSelector } from "@/app/hooks";
import { getRequestErrorMessage } from "@/features/reports/utils/requestError";
import { deleteTeamUser, getTeamUsers, updateTeamUser, type TeamUser } from "@/services/companyServices";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import FormField from "@/components/ui/FormField";
import ReasonDialog from "@/components/ui/ReasonDialog";
import { InviteForm, LocationAccessModal, PendingInvites, type PendingInvite } from "@/features/team/TeamAccess";
import { useLocationOptions } from "@/features/insights/hooks/useReport";

type UserStatus = "invited" | "active" | "deactivated";

interface WorkspaceUserUpdate {
  name: string;
  email: string;
  role: string;
  status: UserStatus;
  reason?: string;
}

function getStatusPillStatus(status: string) {
  switch (status.toLowerCase()) {
    case "active":
      return "ACTIVE";
    case "invited":
    case "pending":
      return "PENDING";
    case "deactivated":
    case "inactive":
      return "DEACTIVE";
    case "suspended":
      return "SUSPENDED";
    default:
      return null;
  }
}

function Team() {
  const currentUser = useAppSelector((state) => state.auth.user);
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingUser, setSavingUser] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);
  const [userToEdit, setUserToEdit] = useState<TeamUser | null>(null);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [locationUser, setLocationUser] = useState<TeamUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<TeamUser | null>(null);
  const locations = useLocationOptions();
  const locationOptions = locations.data ?? [];
  const locationNames = new Map(locationOptions.map((l) => [l.id, l.name]));
  const isCurrentUser = (user: TeamUser) =>
    user.id === currentUser?.id ||
    user.email.trim().toLowerCase() === currentUser?.email.trim().toLowerCase();

  const refreshUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getTeamUsers();
      setUsers(response.data.data);
      setInvites(response.data.pendingInvites ?? []);
    } catch (requestError: unknown) {
      const message = getRequestErrorMessage(requestError);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialUsers() {
      try {
        const response = await getTeamUsers();
        if (!cancelled) { setUsers(response.data.data); setInvites(response.data.pendingInvites ?? []); }
      } catch (requestError: unknown) {
        if (cancelled) return;
        setError(getRequestErrorMessage(requestError));
        toast.error(getRequestErrorMessage(requestError));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadInitialUsers();
    return () => {
      cancelled = true;
    };
  }, []);

  const saveUser = async (
    user: TeamUser,
    data: WorkspaceUserUpdate,
  ) => {
    if (!user.id) {
      toast.error("Unable to update this user because their ID is missing.");
      return false;
    }
    if (isCurrentUser(user)) {
      toast.error("You cannot change your own account from Team settings.");
      return false;
    }
    if (savingUser) return false;
    setSavingUser(true);
    try {
      await updateTeamUser({ id: user.id, data });
      toast.success("User updated successfully.");
      await refreshUsers();
      return true;
    } catch (updateError) {
      toast.error(getRequestErrorMessage(updateError));
      return false;
    } finally {
      setSavingUser(false);
    }
  };


  const handleDeleteUser = async (user: TeamUser) => {
    if (deletingUser || savingUser) return;

    if (!user.id || isCurrentUser(user)) {
      toast.error("You cannot delete your own account from Team settings.");
      return;
    }

    setDeletingUser(true);

    try {
      await deleteTeamUser(user.id);
      toast.success("User deleted successfully.");

      if (userToEdit?.id === user.id) {
        setUserToEdit(null);
      }

      await refreshUsers();
    } catch (deleteError: unknown) {
      toast.error(getRequestErrorMessage(deleteError));
    } finally {
      setDeletingUser(false);
    }
  };


  const userColumns: DataTableColumn<TeamUser>[] = [
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
      key: "locations",
      header: "Locations",
      render: (user) =>
        user.role === "company_admin" ? (
          <span className="text-sm text-text-muted">All</span>
        ) : (
          <button type="button" className="text-left text-sm underline decoration-border underline-offset-4 hover:decoration-primary disabled:no-underline" disabled={isCurrentUser(user)} onClick={() => setLocationUser(user)}>
            {user.allowedLocationIds?.length ? user.allowedLocationIds.map((id) => locationNames.get(id) ?? "Unknown").join(", ") : "All"}
          </button>
        ),
    },
    {
      key: "action",
      header: "Action",
      render: (user) =>
        isCurrentUser(user) ? (
          <span className="text-sm text-text-muted">You</span>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setUserToEdit(user)}
            >
              Edit
            </Button>

            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={deletingUser || savingUser}
              loading={deletingUser && userToEdit?.id === user.id}
              onClick={() => setUserToDelete(user)}
            >
              Delete
            </Button>
          </div>
        ),
    }

  ];

  return (
    <PageLayout
      headTitle="access"
      title="Team"
      description="Invite teammates and manage access to this workspace."
    >
      {/* <InviteCard onUserCreated={refreshUsers} /> */}
      <InviteForm locations={locationOptions} onInvited={refreshUsers} />
      <PendingInvites invites={invites} locations={locationOptions} onChanged={refreshUsers} />

      {error && (
        <p role="alert" className="text-sm text-danger">
          Unable to load team members: {error}
        </p>
      )}

      <DataTable
        tableHead="Workspace Users"
        tableSubHead={`${users.length} user${users.length === 1 ? "" : "s"}`}
        columns={userColumns}
        data={users}
        loading={loading}
        getRowKey={(user) => user.id}
        emptyMessage="No users found in this workspace."
      />

      {
        userToEdit &&
        <Modal
          open
          title="Edit workspace user"
          description="Update this workspace user’s details and access."
          onClose={() => setUserToEdit(null)}
          size="md"
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              const update: WorkspaceUserUpdate = {
                name: String(formData.get("name")).trim(),
                email: String(formData.get("email")).trim(),
                role: String(formData.get("role")),
                status: String(formData.get("status")) as UserStatus,
                // reason: String(formData.get("reason")).trim(),
              };
              void saveUser(userToEdit, update).then((saved) => {
                if (saved) setUserToEdit(null);
              });
            }}
            className="flex flex-col gap-5"
          >
            <FormField label="Name" htmlFor="workspace-user-name">
              <Input
                id="workspace-user-name"
                name="name"
                required
                defaultValue={userToEdit.name}
              />
            </FormField>
            <FormField label="Email" htmlFor="workspace-user-email">
              <Input
                id="workspace-user-email"
                name="email"
                type="email"
                required
                defaultValue={userToEdit.email}
              />
            </FormField>
            <FormField label="Role" htmlFor="workspace-user-role">
              <Select
                id="workspace-user-role"
                name="role"
                defaultValue={userToEdit.role}
              >
                <option value="company_admin">Admin</option>
                <option value="company_viewer">Viewer</option>
              </Select>
            </FormField>
            <FormField label="Status" htmlFor="workspace-user-status">
              <Select
                id="workspace-user-status"
                name="status"
                defaultValue={userToEdit.status}
              >
                <option value="invited">Invited</option>
                <option value="active">Active</option>
                <option value="deactivated">Deactivated</option>
              </Select>
            </FormField>
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
              {/* <Button
                type="button"
                variant="destructive"
                onClick={() => void handleDeleteUser()}
                disabled={deletingUser || savingUser}
                loading={deletingUser}
              >
                Delete
              </Button> */}
              <Button
                type="button"
                variant="outline"
                onClick={() => setUserToEdit(null)}
                disabled={savingUser}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={savingUser}
              >
                Save changes
              </Button>
            </div>
          </form>
        </Modal>
      }

      {userToDelete && (
        <ReasonDialog
          title={`Remove ${userToDelete.name}?`}
          description={`${userToDelete.email} loses access to this company straight away. Their past actions stay in the audit log.`}
          requireReason={false}
          confirmLabel="Remove from team"
          destructive
          busy={deletingUser}
          onClose={() => setUserToDelete(null)}
          onConfirm={() => {
            const user = userToDelete;
            setUserToDelete(null);
            void handleDeleteUser(user);
          }}
        />
      )}
      {locationUser && (
        <LocationAccessModal user={locationUser} locations={locationOptions} onClose={() => setLocationUser(null)} onSaved={refreshUsers} />
      )}
    </PageLayout>
  );
}

export default Team;
