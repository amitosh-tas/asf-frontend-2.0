
import { Link } from "react-router-dom";

function Unauthorized() {
  return (
    <div className="auth-page flex min-h-dvh items-center justify-center px-5 py-12">
      <main className="auth-card w-full max-w-lg rounded-[26px] border border-border/90 bg-card px-6 py-10 text-center sm:px-10">
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
          className="mt-7 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary transition hover:bg-primary/90"
        >
          Back to dashboard
        </Link>
      </main>
    </div>
  );
}

export default Unauthorized
