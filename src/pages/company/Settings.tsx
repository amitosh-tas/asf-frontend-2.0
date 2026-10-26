import { useMemo, useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import {
  useCompanyApiKeys,
  ApiKeyTable,
  RotateKeyModal,
  NewSecretModal,
  CreateApiKeyModal,
  EditApiKeyModal,
  RevokeApiKeyModal,
} from "@/features/api-keys";
import { normalizeAllowedOrigin } from "@/features/api-keys/utils/origins";
import Connectors from "@/features/connectors/components/Connectors";
import SupportAccessLog from "@/features/support/components/SupportAccessLog";
import Button from "@/components/ui/Button";
import { Plus } from "lucide-react";

function Settings() {
  const {
    keys,
    loading,
    rotating,
    creating,
    updating,
    revoking,
    error,
    createError,
    selectedKey,
    setSelectedKey,
    newSecret,
    secretCopied,
    copyError,
    fetchKeys,
    rotateKey,
    createKey,
    updateKey,
    revokeKey,
    copySecret,
    closeSecretModal,
  } = useCompanyApiKeys();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [keyToEdit, setKeyToEdit] = useState<(typeof keys)[number] | null>(null);
  const [keyToRevoke, setKeyToRevoke] = useState<(typeof keys)[number] | null>(
    null,
  );

  const existingOrigins = useMemo(
    () =>
      [...new Set(
        keys
          .flatMap((key) => key.allowedOrigins ?? [])
          .map(
            (origin) =>
              normalizeAllowedOrigin(origin.trim()) ?? origin.trim().toLowerCase(),
          )
          .filter(Boolean),
      )],
    [keys],
  );
  const editOrigins = useMemo(
    () =>
      keyToEdit
        ? [
            ...new Set(
              keys
                .filter((key) => key.id !== keyToEdit.id)
                .flatMap((key) => key.allowedOrigins ?? [])
                .map(
                  (origin) =>
                    normalizeAllowedOrigin(origin.trim()) ??
                    origin.trim().toLowerCase(),
                )
                .filter(Boolean),
            ),
          ]
        : [],
    [keys, keyToEdit],
  );
  const activeKeys = keys.filter((key) => !key.revokedAt).length;

  return (
    <PageLayout title="Settings" headTitle="Manage your workflow">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="font-heading text-lg font-semibold">
              API keys
            </h2>

            <p className="text-sm text-text-muted">
              Manage the API credentials used to connect your website
              to Ledger.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-text-muted">
              <i className="fi fi-rr-shield-check" />
              Keys are sensitive credentials
            </div>
            {activeKeys === 0 && (
              <Button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                disabled={loading}
                icon={<Plus size={16} />}
              >
                Generate API key
              </Button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-danger/30 bg-danger/5 p-4 text-sm text-danger"
          >
            <span>{error}</span>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void fetchKeys()}
              className="underline"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Table */}
        {!error && (
          <ApiKeyTable
            keys={keys}
            loading={loading}
            busy={rotating || updating || revoking}
            onRotate={setSelectedKey}
            onEdit={setKeyToEdit}
            onRevoke={setKeyToRevoke}
          />
        )}

        {/* Modals */}
        <RotateKeyModal
          apiKey={selectedKey}
          rotating={rotating}
          onCancel={() => setSelectedKey(null)}
          onConfirm={() => void rotateKey()}
        />

        {keyToEdit && (
          <EditApiKeyModal
            key={keyToEdit.id}
            apiKey={keyToEdit}
            existingOrigins={editOrigins}
            saving={updating}
            onCancel={() => setKeyToEdit(null)}
            onSubmit={async (id, credentials) => {
              const updated = await updateKey(id, credentials);
              if (updated) setKeyToEdit(null);
              return updated;
            }}
          />
        )}

        <RevokeApiKeyModal
          apiKey={keyToRevoke}
          revoking={revoking}
          onCancel={() => setKeyToRevoke(null)}
          onConfirm={() => {
            if (keyToRevoke) {
              void revokeKey(keyToRevoke.id).then((revoked) => {
                if (revoked) setKeyToRevoke(null);
              });
            }
          }}
        />

        <CreateApiKeyModal
          open={createModalOpen}
          creating={creating}
          error={createError}
          existingOrigins={existingOrigins}
          onCancel={() => setCreateModalOpen(false)}
          onSubmit={createKey}
        />

        <NewSecretModal
          secret={newSecret}
          copied={secretCopied}
          copyError={copyError}
          onCopy={() => void copySecret()}
          onClose={closeSecretModal}
        />
      </div>

      <Connectors />
      <SupportAccessLog />

    </PageLayout>
  );
}

export default Settings;
