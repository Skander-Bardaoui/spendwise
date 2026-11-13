import { AlertCircle, CheckCircle2, X } from 'lucide-react'

type AuthAlertProps = {
  variant: 'error' | 'success'
  message: string
  onClose?: () => void
}

export function AuthAlert({ variant, message, onClose }: AuthAlertProps) {
  const isError = variant === 'error'
  const Icon = isError ? AlertCircle : CheckCircle2

  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`mt-4 flex items-start gap-2.5 rounded-xl border p-3 text-xs ${
        isError
          ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300'
          : 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
      }`}
    >
      <Icon
        className={`mt-0.5 h-4 w-4 shrink-0 ${
          isError ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
        }`}
        aria-hidden="true"
      />
      <p className="flex-1 leading-relaxed">{message}</p>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer le message"
          className={`transition-colors ${
            isError
              ? 'text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300'
              : 'text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300'
          }`}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
