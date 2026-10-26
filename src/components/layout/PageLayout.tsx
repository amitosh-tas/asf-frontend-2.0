import type { ReactNode } from "react"


interface IPageLayout{
  headTitle: string,
  children: ReactNode,
  title?: string,
  description?: string,
  actions?: ReactNode,
}



export default function PageLayout({
  headTitle,
  children,
  title,
  description,
  actions,
}: IPageLayout) {
  return (
    <div className="mx-auto w-full max-w-360">
      {(title || description || actions) && (
        <header className="mb-8 items-start justify-between gap-5 border-b border-border pb-6 md:flex-row
        grid grid-cols-1 md:grid-cols-3
        ">
          <div className="flex min-w-0 flex-col gap-2 md:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
              {headTitle}
            </p>
            {title &&
              <h1
              className="font-heading text-2xl font-semibold tracking-[-0.03em] text-text sm:text-[28px]">
                {title}
              </h1>
            }
            {description &&
            <p className="max-w-lg text-sm leading-6 text-text-muted">
              {description}
            </p>
            }
          </div>

          {actions &&
          <div className="flex w-full flex-wrap items-end justify-end gap-3 md:w-fit md:flex-col">{actions}</div>}
        </header>
      )}

      <div
      className="flex min-w-0 flex-col gap-6">
        {children}
      </div>
    </div>
  )
}
