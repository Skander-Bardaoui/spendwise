import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ImageOff, Loader2, ZoomIn } from 'lucide-react'
import { ImageLightbox } from '@/components/ui/ImageLightbox'
import { getSignedUrl, receiptKeys } from '@/services/receipts'

type ReceiptViewerProps = {
  path: string
  className?: string
}

const SIGNED_URL_STALE_MS = 45 * 60_000
const SIGNED_URL_GC_MS = 65 * 60_000

export function ReceiptViewer({
  path,
  className = 'h-12 w-12',
}: ReceiptViewerProps) {
  const [open, setOpen] = useState(false)

  const { data: url, isPending, isError, refetch } = useQuery({
    queryKey: receiptKeys.signedUrl(path),
    queryFn: () => getSignedUrl(path),
    staleTime: SIGNED_URL_STALE_MS,
    gcTime: SIGNED_URL_GC_MS,
  })

  if (isPending) {
    return (
      <span
        className={`flex items-center justify-center rounded-lg bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 ${className}`}
        aria-label="Chargement du justificatif"
      >
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      </span>
    )
  }

  if (isError || !url) {
    return (
      <button
        type="button"
        onClick={() => void refetch()}
        title="Justificatif indisponible — réessayer"
        aria-label="Justificatif indisponible, réessayer"
        className={`flex items-center justify-center rounded-lg bg-red-50 text-red-400 transition-colors hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 ${className}`}
      >
        <ImageOff className="h-4 w-4" aria-hidden="true" />
      </button>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Agrandir le justificatif"
        aria-label="Agrandir le justificatif"
        className={`group relative shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200 transition-shadow hover:ring-emerald-400 dark:bg-slate-800 dark:ring-slate-700 ${className}`}
      >
        <img
          src={url}
          alt="Justificatif de dépense"
          loading="lazy"
          className="h-full w-full object-cover"
        />
        <span className="absolute inset-0 flex items-center justify-center bg-slate-950/0 text-white opacity-0 transition-all group-hover:bg-slate-950/40 group-hover:opacity-100">
          <ZoomIn className="h-4 w-4" aria-hidden="true" />
        </span>
      </button>

      <ImageLightbox
        src={url}
        alt="Justificatif de dépense"
        open={open}
        onClose={() => setOpen(false)}
        label="Aperçu du justificatif"
      />
    </>
  )
}
