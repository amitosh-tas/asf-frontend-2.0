import { useState, type RefObject } from "react";
import { SECTIONS } from "../docs/sections";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  activeSectionId: string;
  closeButtonRef: RefObject<HTMLButtonElement | null>;
}

const GROUPS = ["Choose a path", "SDK integration", "Sites without NPM", "Reference"] as const;

export function Sidebar({
  open,
  onClose,
  activeSectionId,
  closeButtonRef,
}: SidebarProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const hasSearchMatches = SECTIONS.some((section) =>
    section.title.toLowerCase().includes(normalizedQuery) ||
    section.children?.some((child) => child.title.toLowerCase().includes(normalizedQuery)),
  );
  return (
    <>
      {open ? (
        <div
          aria-hidden="true"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-neutral-900/30 lg:hidden"
        />
      ) : null}

      <aside
        id="docs-sidebar"
        aria-label="Documentation"
        className={[
          "fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto border-r border-neutral-200 bg-white px-4 py-5 transition-transform duration-200 motion-reduce:transition-none",
          "lg:sticky lg:top-14 lg:z-auto lg:h-[calc(100vh-3.5rem)] lg:w-64 lg:shrink-0 lg:translate-x-0 lg:py-8 lg:pr-3",
          open
            ? "translate-x-0 shadow-xl lg:shadow-none"
            : "max-lg:invisible max-lg:-translate-x-full",
        ].join(" ")}
      >
        <div className="mb-4 flex items-center justify-between lg:hidden">
          <span className="text-sm font-semibold text-neutral-900">Documentation</span>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-100"
          >
            <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
              <path d="m5 5 10 10M15 5 5 15" />
            </svg>
          </button>
        </div>

        <nav aria-label="Sections">
          <label className="mb-5 block px-1">
            <span className="sr-only">Search documentation sections</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search sections…"
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-800 outline-none placeholder:text-neutral-400 focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/15"
            />
          </label>
          {GROUPS.map((group) => (
            <div key={group} className="mb-6">
              {SECTIONS.filter((section) => section.group === group)
                .map((section) => ({
                  ...section,
                  children: section.children?.filter((child) =>
                    `${child.title} ${section.title}`.toLowerCase().includes(normalizedQuery),
                  ),
                }))
                .filter((section) => !normalizedQuery || section.title.toLowerCase().includes(normalizedQuery) || section.children?.length)
                .map((section, index) => {
                  const active = section.id === activeSectionId;
                  return (
                    <div key={section.id}>
                      {index === 0 ? <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">{group}</p> : null}
                      <div>
                        <a
                          href={`#${section.id}`}
                          onClick={onClose}
                          aria-current={active ? "location" : undefined}
                          className={[
                            "block rounded-md px-2 py-1.5 text-sm transition",
                            active
                              ? "bg-accent-soft font-medium text-accent"
                              : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
                          ].join(" ")}
                        >
                          {section.title}
                        </a>
                        {section.children?.map((child) => (
                          <a key={child.id} href={`#${child.id}`} onClick={onClose} className="ml-2 block rounded-md px-2 py-1 text-[13px] text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900">{child.title}</a>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          ))}
          {normalizedQuery && !hasSearchMatches ? <p className="px-2 text-xs text-neutral-400">No matching sections</p> : null}
        </nav>
      </aside>
    </>
  );
}
