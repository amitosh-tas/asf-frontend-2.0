import type { ReactNode } from "react";
import Title from "@/components/ui/Title";

/** The card used by every signed-out page (sign-in, reset, verify, invite). */
export default function AuthShell({ title, subtitle, children }: { title: string; subtitle?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full cursor-default items-center justify-center bg-page-background px-4 py-10 text-text sm:px-6">
      <main className="w-full max-w-md rounded-3xl border border-border bg-card px-6 py-9 shadow-lg sm:px-10 sm:py-10">
        <div className="mb-10">
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            <Title />
            <span className="text-text-muted">.</span>
          </h1>
        </div>
        <div className="mb-8">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">{title}</h2>
          {subtitle && <p className="mt-3 text-sm leading-6 text-text-muted">{subtitle}</p>}
        </div>
        {children}
      </main>
    </div>
  );
}
