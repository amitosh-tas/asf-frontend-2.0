import { useCallback, useEffect, useRef, useState } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { TableOfContents } from "./components/TableOfContents";
import { DocsPage } from "./docs/DocsPage";
import { ALL_IDS, PARENT_OF } from "./docs/sections";
import { useActiveSection } from "./hooks/useActiveSection";

import "./index.css"

export default function Docs() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const hasOpenedRef = useRef(false);

  const activeId = useActiveSection(ALL_IDS);
  const activeSectionId = PARENT_OF[activeId] ?? activeId;

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  // Escape closes the mobile drawer; body scroll is locked while it is open.
  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  // Move focus into the drawer when it opens and back to the menu button when it closes.
  useEffect(() => {
    if (menuOpen) {
      hasOpenedRef.current = true;
      closeButtonRef.current?.focus();
    } else if (hasOpenedRef.current) {
      menuButtonRef.current?.focus();
    }
  }, [menuOpen]);

  // If the viewport grows to desktop width the drawer is no longer needed.
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setMenuOpen(false);
      }
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-60 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-neutral-900 focus:shadow-lg focus:ring-1 focus:ring-neutral-300"
      >
        Skip to content
      </a>

      <Header
        menuOpen={menuOpen}
        onMenuToggle={() => setMenuOpen((open) => !open)}
        menuButtonRef={menuButtonRef}
        activeSectionId={activeSectionId}
      />

      <div className="mx-auto flex max-w-360">
        <Sidebar
          open={menuOpen}
          onClose={closeMenu}
          activeSectionId={activeSectionId}
          closeButtonRef={closeButtonRef}
        />

        <main
          id="main"
          tabIndex={-1}
          className="min-w-0 flex-1 px-4 pb-24 pt-10 outline-none sm:px-8 lg:px-12 lg:pt-12"
        >
          <DocsPage />
        </main>

        <TableOfContents activeId={activeId} />
      </div>
    </div>
  );
}
