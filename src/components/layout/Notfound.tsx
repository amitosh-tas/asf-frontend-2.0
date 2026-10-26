import { Link } from "react-router-dom";

function Notfound() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-page-background px-5 py-12">
      <main className="w-full max-w-lg rounded-3xl border border-border bg-card px-6 py-10 shadow-lg text-center sm:px-10">
        <p className="font-heading text-lg font-bold tracking-tight text-text">
          Elysium
        </p>
        <p className="mt-8 font-heading text-7xl font-semibold tracking-tight text-border sm:text-8xl">
          404
        </p>
        <h1 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-text">
          Page not found
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-text-muted">
          The page you're looking for doesn't exist or may have been moved.
          Head back to your dashboard to continue.
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

export default Notfound;
