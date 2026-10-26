import { SECTIONS } from "../docs/sections";

interface TableOfContentsProps {
  activeId: string;
}

export function TableOfContents({ activeId }: TableOfContentsProps) {
  return (
    <nav
      aria-label="On this page"
      className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 overflow-y-auto py-10 pl-2 pr-4 xl:block"
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
        On this page
      </p>
      <ul className="space-y-1 border-l border-neutral-200 text-sm">
        {SECTIONS.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              aria-current={activeId === section.id ? "location" : undefined}
              className={[
                "-ml-px block border-l py-1 pl-3 transition",
                activeId === section.id
                  ? "border-accent font-medium text-accent"
                  : "border-transparent text-neutral-600 hover:border-neutral-400 hover:text-neutral-900",
              ].join(" ")}
            >
              {section.title}
            </a>
            {section.children ? (
              <ul>
                {section.children.map((child) => (
                  <li key={child.id}>
                    <a
                      href={`#${child.id}`}
                      aria-current={activeId === child.id ? "location" : undefined}
                      className={[
                        "-ml-px block border-l py-1 pl-6 text-[13px] transition",
                        activeId === child.id
                          ? "border-accent font-medium text-accent"
                          : "border-transparent text-neutral-500 hover:border-neutral-400 hover:text-neutral-900",
                      ].join(" ")}
                    >
                      {child.title}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </nav>
  );
}
