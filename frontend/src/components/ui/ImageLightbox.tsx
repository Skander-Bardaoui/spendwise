import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

type ImageLightboxProps = {
  src: string
  alt: string
  open: boolean
  onClose: () => void
  label?: string
}

export function ImageLightbox({
  src,
  alt,
  open,
  onClose,
  label = 'Aperçu de l’image',
}: ImageLightboxProps) {
  const [zoomed, setZoomed] = useState(false)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  if (!open) return null

  const close = () => {
    setZoomed(false)
    onClose()
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onClick={close}
      className="fixed inset-0 z-[80] flex flex-col bg-slate-950/90 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white">
        <span className="text-xs font-medium text-white/70">
          {zoomed
            ? 'Cliquez sur l’image pour réduire'
            : 'Cliquez sur l’image pour zoomer'}
        </span>
        <button
          type="button"
          onClick={close}
          aria-label="Fermer l’aperçu"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white transition-colors hover:bg-white/20"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div
        className="flex-1 overflow-auto p-4"
        onClick={(event) => event.stopPropagation()}
      >
        <img
          src={src}
          alt={alt}
          onClick={() => setZoomed((value) => !value)}
          style={zoomed ? { width: '160%' } : undefined}
          className={`mx-auto block rounded-lg shadow-2xl ${
            zoomed
              ? 'max-w-none cursor-zoom-out'
              : 'max-h-full max-w-full cursor-zoom-in object-contain'
          }`}
        />
      </div>
    </div>,
    document.body,
  )
}
