import type { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export default function Modal({
  open,
  title,
  description,
  children,
  onClose,
  size = "md",
}: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`max-h-[calc(100dvh-2rem)] w-full overflow-y-auto rounded-lg border border-border bg-card p-5 shadow-2xl sm:p-6 ${sizeClasses[size]}`}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="modal-title" className="font-heading text-xl font-semibold text-text">
              {title}
            </h2>
            {description && (
              <p className="mt-2 text-sm leading-6 text-text-muted">{description}</p>
            )}
          </div>
          <button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            className="rounded-md p-1.5 text-text-muted hover:bg-hover hover:text-text"
          >
            <i className="fi fi-rr-cross-small" aria-hidden="true" />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
