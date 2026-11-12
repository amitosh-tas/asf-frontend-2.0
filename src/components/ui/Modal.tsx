import { createPortal } from "react-dom";
import type { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-7xl",
};

export default function Modal({
  open,
  title,
  description,
  children,
  onClose,
  size = "md",
}: ModalProps) {
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`max-h-[calc(100dvh-2rem)] w-full overflow-y-auto rounded-[24px] border border-border bg-card p-5 shadow-[0_30px_90px_-35px_rgba(0,0,0,0.45)] sm:p-7 ${sizeClasses[size]}`}
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
    ),
    document.body,
  );
}
