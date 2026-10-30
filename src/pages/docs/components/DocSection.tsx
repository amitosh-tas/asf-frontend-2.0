import type { ReactNode } from "react";

function AnchorLink({ id, title }: { id: string; title: string }) {
  return (
    <a
      href={`#${id}`}
      aria-label={`Link to ${title}`}
      className="ml-2 inline-block rounded px-1 font-normal text-neutral-400 no-underline opacity-0 transition hover:text-accent focus-visible:opacity-100 group-hover:opacity-100"
    >
      #
    </a>
  );
}

interface DocSectionProps {
  id: string;
  title: string;
  children: ReactNode;
}

/** A top-level documentation section: <section> + <h2> with a permalink. */
export function DocSection({ id, title, children }: DocSectionProps) {
  const headingId = `${id}-heading`;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="mt-14 scroll-mt-24 border-t border-neutral-200 pt-12"
    >
      <h2
        id={headingId}
        className="group text-2xl font-semibold tracking-tight text-neutral-900"
      >
        {title}
        <AnchorLink id={id} title={title} />
      </h2>
      <div className="prose-doc">{children}</div>
    </section>
  );
}

interface SubHeadingProps {
  id?: string;
  title: string;
}

export function SubHeading({ id, title }: SubHeadingProps) {
  return (
    <h3
      id={id}
      className="group mt-9 scroll-mt-24 text-lg font-semibold tracking-tight text-neutral-900"
    >
      {title}
      {id ? <AnchorLink id={id} title={title} /> : null}
    </h3>
  );
}
