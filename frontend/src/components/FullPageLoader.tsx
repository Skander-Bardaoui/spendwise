import { Loader2, Wallet } from 'lucide-react'

type FullPageLoaderProps = {
  message?: string
}

export function FullPageLoader({ message = 'Chargement…' }: FullPageLoaderProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
        <Wallet className="h-6 w-6" aria-hidden="true" />
      </div>
      <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin text-emerald-600" aria-hidden="true" />
        <span>{message}</span>
      </div>
    </div>
  )
}
