import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { endSupportSession } from "@/services/supportSessionService";
import type { StoredSupportSession } from "@/services/supportSessionStore";

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

interface SupportSessionBannerProps {
  session: StoredSupportSession;
  workspaceName?: string;
  onEnded: () => void;
}

/** Always-visible reminder that the admin is inside a logged support session. */
export default function SupportSessionBanner({ session, workspaceName, onEnded }: SupportSessionBannerProps) {
  const [now, setNow] = useState(() => Date.now());
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const remaining = new Date(session.expiresAt).getTime() - now;

  const end = async () => {
    if (ending) return;
    setEnding(true);
    try {
      await endSupportSession(session);
    } catch {
      toast.error("Couldn't confirm the session end with the server. It will expire on its own.");
    } finally {
      setEnding(false);
      onEnded();
    }
  };

  return (
    <div role="status" className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-warning/30 bg-warning/10 px-4 py-2 text-sm text-text backdrop-blur">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <Badge variant="warning">Support session</Badge>
        <span className="min-w-0 truncate">
          Viewing {workspaceName ? `“${workspaceName}”` : "company data"} — <span className="text-text-muted">{session.reason}</span>
        </span>
        <Badge variant={session.maskPii ? "success" : "danger"}>{session.maskPii ? "Personal data masked" : "Personal data visible"}</Badge>
      </div>
      <div className="flex items-center gap-3">
        <span className="tabular-nums text-xs text-text-muted" aria-label="Time remaining">
          Ends in {formatRemaining(remaining)}
        </span>
        <Button type="button" size="sm" variant="outline" loading={ending} onClick={() => void end()}>
          End session
        </Button>
      </div>
    </div>
  );
}
