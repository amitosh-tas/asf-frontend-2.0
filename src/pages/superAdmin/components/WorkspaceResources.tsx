import { useState } from "react";
import DataTable, {
  type DataTableColumn,
} from "@/components/ui/DataTable";
import Pill from "@/components/ui/Pill";
import StatusPill from "@/components/ui/StatusPill";
import { RevokeApiKeyModal } from "@/features/api-keys";
import Button from "@/components/ui/Button";

export interface WorkspaceApiKey {
  id: string;
  workspaceId: string;
  siteId: string | null;
  name: string;
  type: string;
  mode: string;
  keyPrefix: string;
  allowedOrigins: string[];
  rateLimitPerMin: number;
  lastUsedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export interface WorkspaceConnector {
  id: string;
  workspaceId: string;
  type: string;
  name: string;
  publicId: string;
  status: string;
  errorCount: number;
  lastError: string | null;
  createdAt: string;
}

interface WorkspaceResourcesProps {
  apiKeys: WorkspaceApiKey[];
  connectors: WorkspaceConnector[];
  revokingApiKeyId: string | null;
  onRevokeApiKey: (apiKey: WorkspaceApiKey) => Promise<boolean>;
}

// function getConnectorStatus(status: string) {
//   switch (status.toLowerCase()) {
//     case "active":
//       return "ACTIVE";
//     case "pending":
//       return "PENDING";
//     case "suspended":
//       return "SUSPENDED";
//     case "deactivated":
//     case "inactive":
//       return "DEACTIVE";
//     default:
//       return null;
//   }
// }

export default function WorkspaceResources({
  apiKeys,
  connectors,
  revokingApiKeyId,
  onRevokeApiKey,
}: WorkspaceResourcesProps) {
  const [apiKeyToRevoke, setApiKeyToRevoke] =
    useState<WorkspaceApiKey | null>(null);
  const origins = [...new Set(apiKeys.flatMap((key) => key.allowedOrigins ?? []))]
    .sort((left, right) => left.localeCompare(right));

  const columns: DataTableColumn<WorkspaceApiKey>[] = [
    {
      key: "name",
      header: "Key name",
      render: (apiKey) => <span className="font-medium">{apiKey.name}</span>,
    },
    {
      key: "keyPrefix",
      header: "API key",
      render: (apiKey) => (
        <code className="whitespace-nowrap rounded bg-surface-muted px-2 py-1 text-xs">
          {apiKey.keyPrefix}
          {"*".repeat(12)}
        </code>
      ),
    },
    {
      key: "mode",
      header: "Mode",
      render: (apiKey) => <Pill name={apiKey.mode.toUpperCase()} />,
    },
    {
      key: "status",
      header: "Status",
      render: (apiKey) => (
        <StatusPill status={apiKey.revokedAt ? "DEACTIVE" : "ACTIVE"} />
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (apiKey) => (
        <span className="whitespace-nowrap text-xs text-text-muted">
          {new Date(apiKey.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (apiKey) => (
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={Boolean(apiKey.revokedAt) || Boolean(revokingApiKeyId)}
          onClick={() => setApiKeyToRevoke(apiKey)}
          aria-label={`Revoke ${apiKey.name}`}
          loading={revokingApiKeyId === apiKey.id}
        >
          {revokingApiKeyId === apiKey.id ? "Revoking…" : "Revoke"}
        </Button>
      ),
    },
  ];

  const confirmRevoke = async () => {
    if (!apiKeyToRevoke || revokingApiKeyId) return;
    if (await onRevokeApiKey(apiKeyToRevoke)) {
      setApiKeyToRevoke(null);
    }
  };

  return (
    <div className="space-y-6">
      <DataTable
        tableHead="Workspace API keys"
        tableSubHead={`${apiKeys.length} key${apiKeys.length === 1 ? "" : "s"} found`}
        columns={columns}
        data={apiKeys}
        getRowKey={(apiKey) => apiKey.id}
        emptyMessage="No API keys found in this workspace."
      />

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="mb-5">
          <h2 className="font-heading text-base font-semibold tracking-tight text-text">
            Workspace origins and connectors
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            Allowed origins and payment connectors configured for this workspace.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-text">
              Allowed origins ({origins.length})
            </h3>
            {origins.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {origins.map((origin) => (
                  <li
                    key={origin}
                    className="break-all rounded-lg border border-border bg-surface-muted/40 px-3 py-2"
                  >
                    <code className="text-xs text-text">{origin}</code>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-text-muted">
                No allowed origins configured.
              </p>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-text">
              Connectors ({connectors.length})
            </h3>
            {connectors.length > 0 ? (
              <ul className="mt-3 space-y-3">
                {connectors.map((connector) => {
                  // const status = getConnectorStatus(connector.status);
                  return (
                    <li
                      key={connector.id}
                      className="rounded-lg border border-border p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-medium text-text">
                            {connector.name}
                          </p>
                          <p className="mt-0.5 text-xs capitalize text-text-muted">
                            {connector.type.replaceAll("_", " ")}
                          </p>
                        </div>
                        {/* {status ? (
                          <StatusPill status={status} />
                        ) : (
                          <Pill name={connector.status} />
                        )} */}
                      </div>
                      <p className="mt-3 break-all text-xs text-text-muted">
                        ID: <code>{connector.publicId}</code>
                      </p>
                      {connector.errorCount > 0 && (
                        <p className="mt-2 text-xs text-danger">
                          {connector.errorCount} error
                          {connector.errorCount === 1 ? "" : "s"}
                          {connector.lastError ? `: ${connector.lastError}` : ""}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-text-muted">
                No connectors configured.
              </p>
            )}
          </div>
        </div>
      </section>

      <RevokeApiKeyModal
        apiKey={apiKeyToRevoke}
        revoking={Boolean(revokingApiKeyId)}
        onCancel={() => setApiKeyToRevoke(null)}
        onConfirm={() => void confirmRevoke()}
      />
    </div>
  );
}
