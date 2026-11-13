import { forwardRef, useId, useState } from 'react'
import type { ComponentPropsWithRef, ReactNode } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type AuthFieldProps = ComponentPropsWithRef<'input'> & {
  label: string
  icon: LucideIcon
  error?: string
  hint?: ReactNode
}

export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(
  function AuthField(
    { label, icon: Icon, error, hint, type = 'text', id, className, ...props },
    ref,
  ) {
    const generatedId = useId()
    const inputId = id ?? generatedId
    const [revealed, setRevealed] = useState(false)
    const isPassword = type === 'password'
    const inputType = isPassword && revealed ? 'text' : type

    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-slate-700"
          >
            {label}
          </label>
          {hint}
        </div>

        <div className="relative flex items-center">
          <Icon
            className="pointer-events-none absolute left-3.5 h-[18px] w-[18px] text-slate-400"
            aria-hidden="true"
          />
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${inputId}-error` : undefined}
            className={[
              'h-11 w-full rounded-xl border bg-white pl-10 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400',
              isPassword ? 'pr-11' : 'pr-3.5',
              'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20',
              error ? 'border-red-300' : 'border-slate-200',
              className ?? '',
            ].join(' ')}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setRevealed((value) => !value)}
              aria-label={
                revealed
                  ? 'Masquer le mot de passe'
                  : 'Afficher le mot de passe'
              }
              className="absolute right-3 p-1 text-slate-400 transition-colors hover:text-slate-600"
            >
              {revealed ? (
                <EyeOff className="h-[18px] w-[18px]" aria-hidden="true" />
              ) : (
                <Eye className="h-[18px] w-[18px]" aria-hidden="true" />
              )}
            </button>
          )}
        </div>

        {error && (
          <p
            id={`${inputId}-error`}
            className="text-xs font-medium text-red-600"
          >
            {error}
          </p>
        )}
      </div>
    )
  },
)
