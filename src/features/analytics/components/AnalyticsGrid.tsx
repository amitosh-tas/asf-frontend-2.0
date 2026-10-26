import type { ReactNode } from "react"


interface IGrid{
  children: ReactNode
}


function AnalyticsGrid({ children } : IGrid) {
  return (
    <div
    className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {children}
    </div>
  )
}

export default AnalyticsGrid