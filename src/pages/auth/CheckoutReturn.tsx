import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Title from "@/components/ui/Title";
import { getRegistrationStatus, type RegistrationStatus } from "@/services/billingService";
import { getRequestErrorMessage } from "@/features/reports/utils/requestError";

const MAX_ATTEMPTS = 10;

function CheckoutReturn() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<RegistrationStatus["status"]>("pending");
  const [message, setMessage] = useState("Verifying your payment and preparing your workspace…");
  const [error, setError] = useState("");
  const canceled = searchParams.get("canceled") === "true";

  useEffect(() => {
    if (canceled) {
      window.location.replace("https://asf-tas.vercel.app/billing?canceled=true");
      return;
    }

    let active = true;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const check = async () => {
      try {
        const result = await getRegistrationStatus();
        if (!active) return;
        setStatus(result.status);
        if (result.message) setMessage(result.message);
        if (result.status === "active" && result.workspaceId) {
          navigate("/", { replace: true });
          return;
        }
        if (result.status === "failed" || result.status === "canceled") return;
        attempts += 1;
        if (attempts < MAX_ATTEMPTS) timer = setTimeout(() => void check(), 3000);
        else setMessage("Payment verification is taking longer than usual. Refresh this page to check again.");
      } catch (requestError) {
        if (active) setError(getRequestErrorMessage(requestError));
      }
    };

    void check();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [canceled, navigate]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-page-background px-4 py-8">
      <main className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 shadow-lg">
        <p className="font-heading text-2xl font-bold"><Title /><span className="text-text-muted">.</span></p>
        <h1 className="mt-10 font-heading text-2xl font-semibold">
          {canceled || status === "canceled" ? "Checkout canceled" : status === "failed" ? "Payment could not be verified" : "Provisioning your workspace"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-text-muted">{canceled ? "No workspace was activated. You can return to billing and try again." : message}</p>
        {error && <div className="mt-5"><Alert>{error}</Alert></div>}
        <div className="mt-6 flex gap-3">
          <Button type="button" onClick={() => window.location.reload()}>Check again</Button>
          <Link to="/billing" className="inline-flex min-h-10 items-center rounded-md border border-border px-3.5 py-2 text-sm font-medium">Return to billing</Link>
        </div>
      </main>
    </div>
  );
}

export default CheckoutReturn;
