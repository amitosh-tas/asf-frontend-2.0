
import { Link } from "react-router-dom";

function Unauthorized() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-page-background px-5 py-12">
      <main className="w-full max-w-lg rounded-3xl border border-border bg-card px-6 py-10 shadow-lg text-center sm:px-10">
        <p className="text-xs font-medium text-text-muted">
          Access restricted
        </p>
        <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-text">
          You don't have access to this page
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-text-muted">
          Your current account doesn’t have permission to view this area.
          Contact your workspace administrator if you need access.
        </p>
        <Link
          to="/"
          className="mt-7 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary/90"
        >
          Back to dashboard
        </Link>
      </main>
    </div>
  );
}

export default Unauthorized