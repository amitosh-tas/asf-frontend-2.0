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
        <header className="mb-2 grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
          <div className="flex min-w-0 flex-col gap-2">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#78934c]">
              {headTitle}
            </p>
            {title &&
              <h1
              className="font-heading text-3xl font-extrabold tracking-[-0.055em] text-text sm:text-[38px]">
                {title}
              </h1>
            }
            {description &&
            <p className="max-w-2xl text-[13px] leading-6 text-text-muted">
              {description}
            </p>
            }
          </div>

          {actions &&
          <div className="w-full rounded-[18px] border border-border bg-card p-3 shadow-[0_5px_18px_rgba(32,43,37,0.035)] xl:w-fit">{actions}</div>}
        </header>
      )}

      <div
      className="flex min-w-0 flex-col gap-4">
        {children}
      </div>
    </div>
  )
}
