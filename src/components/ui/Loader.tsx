import "@/app/loader.css";

interface LoaderProps {
  label?: string;
  className?: string;
}

/** Full-page wait state using the app's animated loader. */
export default function Loader({ label = "Loading", className = "" }: LoaderProps) {
  return (
    <div
      className={`grid min-h-screen place-items-center bg-page-background ${className}`}
      role="status"
      aria-label={label}
    >
      <span className="loader" aria-hidden="true" />
    </div>
  );
}
