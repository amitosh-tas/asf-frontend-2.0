import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import { useAsync } from "../hooks/useReport";
import { ATTRIBUTION_MODELS, MATCH_LABELS, REASON_LABELS, channelLabel, fetchOrderAttribution, type OrderAttribution } from "@/services/insights";
import { formatDateTime, formatMinorUnits } from "@/features/reports/utils/formatting";

/** Order detail (5.4): the journey and the credit each model gives, side by side. */
export default function OrderDetailModal({ orderId, workspaceId, onClose }: { orderId: string; workspaceId?: string; onClose: () => void }) {
  const r = useAsync<OrderAttribution>(() => fetchOrderAttribution(orderId, workspaceId), [orderId, workspaceId]);
  const o = r.data;
  return (
    <Modal open title={o ? `Order ${o.externalId}` : "Order"} description={o ? formatDateTime(o.orderedAt) : undefined} onClose={onClose} size="lg">
      {r.error && <p className="text-sm text-danger">{r.error}</p>}
      {!o && !r.error && <p className="text-sm text-text-muted">Loading…</p>}
      {o && (
        <div className="flex flex-col gap-5 text-sm">
          <div className="flex flex-wrap gap-2">
            <Badge variant={o.matchMethod === "none" ? "warning" : "success"}>Matched by: {MATCH_LABELS[o.matchMethod] ?? o.matchMethod}</Badge>
            <Badge>{o.isNewCustomer ? "New customer" : "Returning / unknown"}</Badge>
            <Badge>{o.status.replace(/_/g, " ")}</Badge>
            {o.bookingId && <Badge variant="primary">Paid booking</Badge>}
          </div>
          {o.attributionReason && <p className="text-text-muted">Why no source: {REASON_LABELS[o.attributionReason] ?? o.attributionReason}</p>}
          <p>
            Net <strong>{formatMinorUnits(o.netMinorUnits, o.currency)}</strong>
            {o.refundedMinorUnits !== "0" && <> · refunded {formatMinorUnits(o.refundedMinorUnits, o.currency)}</>}
          </p>
          <div>
            <h3 className="mb-2 font-semibold">Journey</h3>
            {o.journey.length === 0 ? (
              <p className="text-text-muted">No tracked visits — shown as Direct / unknown.</p>
            ) : (
              <ol className="flex flex-col gap-1.5">
                {o.journey.map((t) => (
                  <li key={t.id} className="flex justify-between gap-3 border-b border-border pb-1.5 last:border-0">
                    <span>
                      {channelLabel(t.channel)}
                      {t.campaign && <span className="text-text-muted"> · {t.campaign}</span>}
                      {t.clickId && <span className="text-text-muted"> · {t.clickId}</span>}
                    </span>
                    <span className="text-text-muted">{formatDateTime(t.touchedAt)}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
          <div className="overflow-x-auto">
            <h3 className="mb-2 font-semibold">Credit under every model</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-text-muted">
                  <th className="py-1 pr-3">Model</th>
                  <th className="py-1">Credit</th>
                </tr>
              </thead>
              <tbody>
                {ATTRIBUTION_MODELS.map((m) => (
                  <tr key={m.value} className="border-t border-border">
                    <td className="py-1.5 pr-3 font-medium">{m.label}</td>
                    <td className="py-1.5">
                      {(o.attribution[m.value] ?? []).map((c, i) => (
                        <span key={i} className="mr-3 inline-block">
                          {channelLabel(c.channel)} {Math.round(c.share * 1000) / 10}% ({formatMinorUnits(c.amountMinorUnits, o.currency)})
                        </span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {o.refunds.length > 0 && (
            <div>
              <h3 className="mb-2 font-semibold">Refunds</h3>
              {o.refunds.map((rf) => (
                <p key={rf.id}>
                  {formatDateTime(rf.refundedAt)} — {formatMinorUnits(rf.amountMinorUnits, rf.currency)} {rf.reason && <span className="text-text-muted">({rf.reason})</span>}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
