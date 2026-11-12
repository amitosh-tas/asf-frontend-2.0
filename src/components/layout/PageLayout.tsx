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
        <header className="mb-6 grid grid-cols-1 items-start gap-5 lg:gap-7 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
          <div className="flex min-w-0 flex-col gap-2.5">
            <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-chart-1"><span aria-hidden="true" className="size-1.5 rounded-full bg-chart-1" />
              {headTitle}
            </p>
            {title &&
              <h1
              className="font-heading text-[clamp(1.8rem,3vw,2.45rem)] font-bold leading-[1.08] tracking-[-0.045em] text-text">
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
          <div className="w-full rounded-[20px] border border-border/80 bg-card/90 p-3 shadow-[0_12px_34px_-24px_rgba(26,47,31,0.35)] backdrop-blur-sm xl:w-fit">{actions}</div>}
        </header>
      )}

      <div
      className="flex min-w-0 flex-col gap-5">
        {children}
      </div>
    </div>
  )
}
