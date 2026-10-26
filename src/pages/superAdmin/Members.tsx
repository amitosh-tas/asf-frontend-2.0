import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import PageLayout from "@/components/layout/PageLayout";
import InviteCard from "@/components/ui/InviteCard";
import DataTable, {
  type DataTableColumn,
} from "@/components/ui/DataTable";
import Pill from "@/components/ui/Pill";
// import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

import { getplatformAdmins, deletePlatformAdmin,
  // updatePlatformAdmin 
} from "@/services/platfromAdmin";
import { getRequestErrorMessage } from "@/features/reports/utils/requestError";
import { useAppSelector } from "@/app/hooks";

interface PlatformAdmin {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
}

function Members() {

  const currentUser = useAppSelector((state) => state.auth.user);

  const currentUserId = currentUser?.id ?? currentUser?.id;

  const [showInviteForm, setShowInviteForm] = useState(false);
  const [admins, setAdmins] = useState<PlatformAdmin[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit functionality — temporarily disabled
  // const [editingAdmin, setEditingAdmin] =
  //   useState<PlatformAdmin | null>(null);

  // const [editName, setEditName] = useState("");
  // const [editEmail, setEditEmail] = useState("");
  // const [saving, setSaving] = useState(false);
  const [deletingAdmin, setDeletingAdmin] =
    useState<PlatformAdmin | null>(null);

  const [deleting, setDeleting] = useState(false);

  async function handleDeleteAdmin() {
    if (!deletingAdmin || deleting) return;

    const isSelf =
      currentUserId != null &&
      String(deletingAdmin.id) === String(currentUserId);

    if (isSelf) {
      toast.error("You cannot delete your own account.");
      setDeletingAdmin(null);
      return;
    }

    setDeleting(true);

    try {
      await deletePlatformAdmin(deletingAdmin.id);

      setAdmins((current) =>
        current.filter((admin) => admin.id !== deletingAdmin.id)
      );

      toast.success("Platform admin deleted successfully.");
      setDeletingAdmin(null);
    } catch (error: unknown) {
      toast.error(getRequestErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  }

  const fetchAdmins = useCallback(async () => {
    setLoading(true);

    try {
      const response = await getplatformAdmins();

      // Supports a raw array or common wrapped API responses.
      const result = response.data;
      const rows = Array.isArray(result)
        ? result
        : result?.data ?? result?.admins ?? [];

      setAdmins(
        rows.map((item: Record<string, unknown>) => ({
          ...item,
          id: String(item.id ?? item._id),
          name: String(item.name ?? ""),
          email: String(item.email ?? ""),
          role: String(item.role ?? "platform_admin"),
        }))
      );
    } catch (error: unknown) {
      toast.error(getRequestErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAdmins();
  }, [fetchAdmins]);

  // function openEdit(admin: PlatformAdmin) {
  //   setEditingAdmin(admin);
  //   setEditName(admin.name);
  //   setEditEmail(admin.email);
  // }

  // function closeEdit() {
  //   if (saving) return;

  //   setEditingAdmin(null);
  //   setEditName("");
  //   setEditEmail("");
  // }

  // async function handleEditSubmit(
  //   event: React.SubmitEvent<HTMLFormElement>
  // ) {
  //   event.preventDefault();

  //   if (!editingAdmin || saving) return;

  //   setSaving(true);

  //   try {
  //     await updatePlatformAdmin( { id:editingAdmin.id,
  //       data:{
  //          name: editName,
  //         email: editEmail,
  //       }
  //     });

  //     toast.success("Platform admin updated successfully.");
  //     await fetchAdmins();
  //     closeEdit();
  //   } catch (error: unknown) {
  //     toast.error(getRequestErrorMessage(error));
  //   } finally {
  //     setSaving(false);
  //   }
  // }

  const columns: DataTableColumn<PlatformAdmin>[] = [
    {
      key: "name",
      header: "Member",
      render: (admin) => (
        <div className="flex min-w-0 flex-col gap-1">
          <span className="font-medium text-text">
            {admin.name || "Unnamed"}
          </span>
          <span className="text-xs text-text-muted">
            {admin.email}
          </span>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (admin) => (
        <Pill name={admin.role.replaceAll("_", " ")} />
      ),
    },
    {
      key: "createdAt",
      header: "Joined",
      render: (admin) =>
        admin.createdAt && !Number.isNaN(Date.parse(admin.createdAt))
          ? new Date(admin.createdAt).toLocaleDateString()
          : "—",
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (admin) => {
        const isSelf =
          currentUserId != null &&
          String(admin.id) === String(currentUserId);

        return (
          <div className="flex items-center justify-end gap-2">
            {/* <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => openEdit(admin)}
            >
              Edit
            </Button> */}

            {!isSelf && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeletingAdmin(admin)}
              >
                Delete
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <PageLayout
      title="Members"
      headTitle="Invite and manage members"
      description="Manage platform administrators and invite new members."
      actions={
        <button
          type="button"
          onClick={() => setShowInviteForm((show) => !show)}
          aria-expanded={showInviteForm}
          className="flex h-10 items-center gap-2 cursor-pointer rounded-lg bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {showInviteForm ? "Cancel" : "Add member"}
        </button>
      }
    >
      <div className="space-y-6">
        {showInviteForm && (
          <InviteCard onUserCreated={fetchAdmins} />
        )}

        <DataTable
          tableHead="Platform administrators"
          tableSubHead={`${admins.length} members`}
          columns={columns}
          data={admins}
          getRowKey={(admin) => admin.id}
          loading={loading}
          emptyMessage="No platform administrators found."
        // filters={
        //   <Button
        //     type="button"
        //     variant="outline"
        //     size="sm"
        //     onClick={() => void fetchAdmins()}
        //     disabled={loading}
        //   >
        //     Refresh
        //   </Button>
        // }
        />
      </div>

      {deletingAdmin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) {
              setDeletingAdmin(null);
            }
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-admin-title"
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
          >
            <h2
              id="delete-admin-title"
              className="font-heading text-lg font-semibold text-text"
            >
              Delete platform admin?
            </h2>

            <p className="mt-2 text-sm text-text-muted">
              Are you sure you want to delete{" "}
              <strong>{deletingAdmin.name}</strong> ({deletingAdmin.email})?
              This action may be irreversible.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={deleting}
                onClick={() => setDeletingAdmin(null)}
              >
                Cancel
              </Button>

              <Button
                type="button"
                disabled={deleting}
                onClick={handleDeleteAdmin}
              >
                {deleting ? "Deleting…" : "Delete admin"}
              </Button>
            </div>
          </section>
        </div>
      )}

      {/* Edit popup */}
      {/* {editingAdmin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeEdit();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-admin-title"
            className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2
                  id="edit-admin-title"
                  className="font-heading text-lg font-semibold text-text"
                >
                  Edit platform admin
                </h2>
                <p className="mt-1 text-sm text-text-muted">
                  Update this administrator's details.
                </p>
              </div>

              <button
                type="button"
                onClick={closeEdit}
                disabled={saving}
                aria-label="Close edit dialog"
                className="cursor-pointer rounded-lg px-2 py-1 text-text-muted hover:bg-surface-muted"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="admin-name"
                  className="text-xs font-medium text-text-muted"
                >
                  Name
                </label>
                <Input
                  required
                  disabled={saving}
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  placeholder="Full name"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="admin-email"
                  className="text-xs font-medium text-text-muted"
                >
                  Email
                </label>
                <Input
                  required
                  disabled={saving}
                  type="email"
                  value={editEmail}
                  onChange={(event) => setEditEmail(event.target.value)}
                  placeholder="admin@example.com"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-text-muted">
                  Role
                </label>
                <div className="pt-1">
                  <Pill name="platform admin" />
                </div>
                <p className="text-xs text-text-muted">
                  Platform administrator role cannot be changed here.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={closeEdit}
                >
                  Cancel
                </Button>

                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </form>
          </section>
        </div>
      )} */}
    </PageLayout>
  );
}

export default Members;