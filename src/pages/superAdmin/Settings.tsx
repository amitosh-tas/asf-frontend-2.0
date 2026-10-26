import { useCallback, useEffect, useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import {
  createGateway,
  createIndustry,
  getGateways,
  getIndustries,
} from "@/lib/referenceData";
import toast from "react-hot-toast";
import { getRequestErrorMessage } from "@/features/reports/utils/requestError";
import { Skeleton } from "@/components/ui/Skeleton";
import { deleteIndustry, deleteGateway } from "@/lib/referenceData";
import { Trash2 } from "lucide-react";

interface NamedOption {
  id: string;
  name: string;
}

type ReferenceType = "industry" | "gateway";

function Settings() {
  const [industries, setIndustries] = useState<NamedOption[]>([]);
  const [gateways, setGateways] = useState<NamedOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalType, setModalType] = useState<ReferenceType | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<{
    type: ReferenceType;
    item: NamedOption;
  } | null>(null);

  const [deleting, setDeleting] = useState(false);

  const fetchReferenceData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [industryData, gatewayData] = await Promise.all([
        getIndustries(),
        getGateways(),
      ]);

      setIndustries(industryData);
      setGateways(gatewayData);
    } catch (fetchError) {
      console.error("Failed to load platform reference data:", fetchError);
      setError("Unable to load reference data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  function ReferenceListSkeleton() {
    return (
      <div className="space-y-3" role="status" aria-label="Loading reference data">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="flex items-center justify-between rounded-xl border border-border p-4"
          >
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        ))}

        <span className="sr-only">Loading reference data…</span>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;

    const { type, item } = deleteTarget;
    const label = type === "industry" ? "industry" : "payment gateway";

    setDeleting(true);

    try {
      if (type === "industry") {
        await deleteIndustry(item.id);
        setIndustries((prev) =>
          prev.filter((entry) => entry.id !== item.id),
        );
      } else {
        await deleteGateway(item.id);
        setGateways((prev) =>
          prev.filter((entry) => entry.id !== item.id),
        );
      }

      toast.success(`${label} deleted successfully`);
      setDeleteTarget(null);
    } catch (deleteError) {
      console.error(`Failed to delete ${label}:`, deleteError);
      toast.error(getRequestErrorMessage(deleteError));
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    void fetchReferenceData();
  }, [fetchReferenceData]);

  const openCreateModal = (type: ReferenceType) => {
    setName("");
    setModalType(type);
  };

  const closeCreateModal = () => {
    if (saving) return;

    setModalType(null);
    setName("");
  };

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!modalType || !name.trim() || saving) return;

    const trimmedName = name.trim();

    const existingItems =
      modalType === "industry" ? industries : gateways;

    const alreadyExists = existingItems.some(
      (item) => item.name.trim().toLowerCase() === trimmedName.toLowerCase(),
    );

    if (alreadyExists) {
      toast.error("An entry with this name already exists.");
      return;
    }

    setSaving(true);

    try {
      if (modalType === "industry") {
        await createIndustry(trimmedName);
      } else {
        await createGateway(trimmedName);
      }

      toast.success(
        `${modalType === "industry" ? "Industry" : "Payment gateway"} created successfully.`,
      );

      setModalType(null);
      setName("");

      await fetchReferenceData();
    } catch (createError) {
      console.error("Failed to create reference data:", createError);
      toast.error(getRequestErrorMessage(createError));
    } finally {
      setSaving(false);
    }
  };

  const renderEntries = (items: NamedOption[], type: ReferenceType) => (
    <div className="divide-y divide-border">
      {items.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-text-muted">
          No {type === "industry" ? "industries" : "payment gateways"} found.
          Create one to get started.
        </p>
      ) : (
        items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 px-5 py-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-secondary text-text-muted">
                <i
                  className={
                    type === "industry"
                      ? "fi fi-rr-building"
                      : "fi fi-rr-credit-card"
                  }
                  aria-hidden="true"
                />
              </div>

              <span className="truncate text-sm font-medium text-text-primary">
                {item.name}
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <span className="text-xs text-text-muted">
                {item.id.slice(0, 8)}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteTarget({ type, item })}
                aria-label={`Delete ${item.name}`}
              >
                <Trash2 size={16} className="text-danger" />
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <PageLayout
      title="Platform settings"
      headTitle="Configuration"
      description="Manage platform-wide industries and payment gateway options."
    >
      <div className="flex flex-col gap-6">
        {/* Page actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-text-primary">
              Reference data
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              These options are used throughout the platform.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => void fetchReferenceData()}
            disabled={loading}
          >
            <i className="fi fi-rr-refresh mr-2" aria-hidden="true" />
            Refresh
          </Button>
        </div>

        {/* Loading and error states */}
        {error && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger"
          >
            <span>{error}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void fetchReferenceData()}
              disabled={loading}
            >
              Retry
            </Button>
          </div>
        )}

        {loading && industries.length === 0 && gateways.length === 0 ? (
          <ReferenceListSkeleton />
        ) : (
          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
            {/* Industries */}
            <section className="overflow-hidden rounded-2xl border border-border bg-surface">
              <div className="flex items-center justify-between gap-3 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-secondary">
                    <i
                      className="fi fi-rr-building text-lg"
                      aria-hidden="true"
                    />
                  </div>

                  <div>
                    <h3 className="font-semibold text-text-primary">
                      Industries
                    </h3>
                    <p className="text-sm text-text-muted">
                      {industries.length}{" "}
                      {industries.length === 1 ? "industry" : "industries"}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => openCreateModal("industry")}
                  disabled={loading || Boolean(error)}
                >
                  <i className="fi fi-rr-plus mr-2" aria-hidden="true" />
                  Add industry
                </Button>
              </div>

              {renderEntries(industries, "industry")}
            </section>

            {/* Payment gateways */}
            {/* <section className="overflow-hidden rounded-2xl border border-border bg-surface">
              <div className="flex items-center justify-between gap-3 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-secondary">
                    <i
                      className="fi fi-rr-credit-card text-lg"
                      aria-hidden="true"
                    />
                  </div>

                  <div>
                    <h3 className="font-semibold text-text-primary">
                      Payment gateways
                    </h3>
                    <p className="text-sm text-text-muted">
                      {gateways.length}{" "}
                      {gateways.length === 1 ? "gateway" : "gateways"}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => openCreateModal("gateway")}
                  disabled={loading || Boolean(error)}
                >
                  <i className="fi fi-rr-plus mr-2" aria-hidden="true" />
                  Add gateway
                </Button>
              </div>

              {renderEntries(gateways, "gateway")}
            </section> */}
          </div>
        )}
      </div>

      {/* Shared create modal */}
      {modalType && (
        <Modal
          open
          title={
            modalType === "industry"
              ? "Add industry"
              : "Add payment gateway"
          }
          description={
            modalType === "industry"
              ? "Add an industry that companies can select during setup."
              : "Add a payment gateway that can be selected throughout the platform."
          }
          onClose={closeCreateModal}
          size="sm"
        >
          <form onSubmit={handleCreate} className="flex flex-col gap-5">
            <FormField
              label={modalType === "industry" ? "Industry name" : "Gateway name"}
              htmlFor="reference-name"
            >
              <Input
                id="reference-name"
                type="text"
                required
                maxLength={100}
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={
                  modalType === "industry"
                    ? "e.g. E-commerce & Retail"
                    : "e.g. Razorpay"
                }
              />
            </FormField>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeCreateModal}
                disabled={saving}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                loading={saving}
                disabled={!name.trim() || saving}
              >
                Create {modalType === "industry" ? "industry" : "gateway"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <Modal
          open
          title={`Delete ${deleteTarget.type === "industry" ? "industry" : "payment gateway"
            }?`}
          description="This action cannot be undone."
          onClose={() => {
            if (!deleting) setDeleteTarget(null);
          }}
          size="sm"
        >
          <div className="space-y-5">
            <div className="rounded-xl border border-danger/20 bg-danger/5 p-4">
              <p className="text-sm text-text-muted">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-text-primary">
                  {deleteTarget.item.name}
                </span>
                ?
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={() => void handleDelete()}
                loading={deleting}
                disabled={deleting}
              >
                <Trash2 size={16} className="mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </PageLayout>
  );
}

export default Settings;