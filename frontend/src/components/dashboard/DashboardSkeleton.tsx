const cardClass =
  'animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800'

export function DashboardSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Chargement du tableau de bord…</span>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className={`${cardClass} h-[152px]`} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className={`${cardClass} h-[380px] xl:col-span-1`} />
        <div className={`${cardClass} h-[380px] xl:col-span-2`} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className={`${cardClass} h-[360px] xl:col-span-2`} />
        <div className={`${cardClass} h-[360px] xl:col-span-1`} />
      </div>

      <div className={`${cardClass} h-[280px]`} />
    </div>
  )
}
