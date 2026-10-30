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
        <header className="mb-7 grid grid-cols-1 items-end gap-5 border-b border-border/80 pb-6 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="flex min-w-0 flex-col gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
              {headTitle}
            </p>
            {title &&
              <h1
              className="font-heading text-3xl font-semibold tracking-[-0.045em] text-text sm:text-[34px]">
                {title}
              </h1>
            }
            {description &&
            <p className="max-w-2xl text-sm leading-6 text-text-muted">
              {description}
            </p>
            }
          </div>

          {actions &&
          <div className="flex w-full flex-col items-start gap-2 md:w-fit md:items-end">{actions}</div>}
        </header>
      )}

      <div
      className="flex min-w-0 flex-col gap-5">
        {children}
      </div>
    </div>
  )
}
