import type { RefObject } from "react";
import { VERSION_LABEL } from "../docs/meta";
import { SECTIONS } from "../docs/sections";

function LogoMark() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <rect width="24" height="24" rx="6" fill="#1c1c1c" />
      <path
        d="M7.5 7.5h9M7.5 12h6.5M7.5 16.5h9"
        stroke="#fff"
        strokeWidth="1.9"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

interface HeaderProps {
  menuOpen: boolean;
  onMenuToggle: () => void;
  menuButtonRef: RefObject<HTMLButtonElement | null>;
  activeSectionId: string;
}

export function Header({ menuOpen, onMenuToggle, menuButtonRef, activeSectionId }: HeaderProps) {
  const activeSection = SECTIONS.find((section) => section.id === activeSectionId);
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-14 max-w-[90rem] items-center gap-3 px-4 sm:px-6">
        <button
          ref={menuButtonRef}
          type="button"
          onClick={onMenuToggle}
          aria-label="Open navigation"
          aria-expanded={menuOpen}
          aria-controls="docs-sidebar"
          className="-ml-1.5 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-neutral-700 hover:bg-neutral-100 lg:hidden"
        >
          <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
            <path d="M3.5 6h13M3.5 10h13M3.5 14h13" />
          </svg>
        </button>

        <a
          href="#introduction"
          className="flex items-center gap-2 rounded-md text-[15px] font-semibold tracking-tight text-neutral-900"
        >
          <LogoMark />
          Elysium
        </a>

        <span aria-hidden="true" className="hidden h-5 w-px bg-neutral-200 sm:block" />
        <span className="hidden text-sm text-neutral-600 sm:block">Documentation</span>

        <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 font-mono text-[11px] text-neutral-600">
          {VERSION_LABEL}
        </span>

        <span aria-hidden="true" className="hidden h-5 w-px bg-neutral-200 md:block" />
        <span className="hidden max-w-56 truncate text-sm text-neutral-500 md:block" aria-live="polite">{activeSection?.title}</span>

        <nav aria-label="Quick links" className="ml-auto hidden items-center gap-1 md:flex">
          {[
            { href: "#sdk-integration", label: "SDK" },
            { href: "#sites-without-npm", label: "No NPM" },
            { href: "#verification", label: "Troubleshooting" },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-md px-2.5 py-1.5 text-sm text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
