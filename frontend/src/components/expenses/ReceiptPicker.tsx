import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import {
  Camera,
  ImagePlus,
  Images,
  Paperclip,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { ReceiptViewer } from '@/components/expenses/ReceiptViewer'

type ReceiptPickerProps = {
  existingPath: string | null
  selectedFile: File | null
  isRemoved: boolean
  onSelectFile: (file: File | null) => void
  onRemoveExisting: () => void
}

const MAX_FILE_SIZE = 15 * 1024 * 1024

const actionButtonClass =
  'inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-white px-2.5 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800'

export function ReceiptPicker({
  existingPath,
  selectedFile,
  isRemoved,
  onSelectFile,
  onRemoveExisting,
}: ReceiptPickerProps) {
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const previewRef = useRef<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    }
  }, [])

  const resetPreview = () => {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current)
      previewRef.current = null
    }
    setPreviewUrl(null)
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // Permet de re-sélectionner le même fichier après une suppression.
    event.target.value = ''

    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Choisissez un fichier image (JPG, PNG, WebP...).')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Image trop lourde : 15 Mo maximum.')
      return
    }

    resetPreview()
    const url = URL.createObjectURL(file)
    previewRef.current = url
    setPreviewUrl(url)
    onSelectFile(file)
  }

  const openGallery = () => galleryInputRef.current?.click()
  const openCamera = () => cameraInputRef.current?.click()
  const hasExisting = Boolean(existingPath) && !isRemoved

  const actionButtons = (
    <>
      <button
        type="button"
        onClick={openGallery}
        className={actionButtonClass}
      >
        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
        Remplacer
      </button>
      <button
        type="button"
        onClick={openCamera}
        aria-label="Prendre une nouvelle photo avec la caméra"
        title="Prendre une photo"
        className={`${actionButtonClass} px-2`}
      >
        <Camera className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </>
  )

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <Paperclip className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
          Justificatif{' '}
          <span className="font-normal text-slate-400 dark:text-slate-500">(optionnel)</span>
        </span>
        <span className="text-[11px] text-slate-400 dark:text-slate-500">
          JPG, PNG, WebP · 15 Mo max
        </span>
      </div>

      {selectedFile && previewUrl ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200 dark:bg-slate-800/60 dark:ring-slate-700">
          <img
            src={previewUrl}
            alt="Aperçu du justificatif sélectionné"
            className="h-16 w-16 shrink-0 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-slate-700"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
              {selectedFile.name}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {Math.max(1, Math.round(selectedFile.size / 1024))} Ko · sera
              compressé en 1600 px / qualité 0.8 avant l’envoi
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {actionButtons}
            <button
              type="button"
              onClick={() => {
                resetPreview()
                onSelectFile(null)
              }}
              className={`${actionButtonClass} hover:bg-red-50 hover:text-red-600 hover:ring-red-200 dark:hover:bg-red-500/10 dark:hover:text-red-400 dark:hover:ring-red-500/30`}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Supprimer
            </button>
          </div>
        </div>
      ) : hasExisting && existingPath ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200 dark:bg-slate-800/60 dark:ring-slate-700">
          <ReceiptViewer path={existingPath} className="h-16 w-16" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              Justificatif existant
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Cliquez sur l’aperçu pour agrandir.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {actionButtons}
            <button
              type="button"
              onClick={onRemoveExisting}
              className={`${actionButtonClass} hover:bg-red-50 hover:text-red-600 hover:ring-red-200 dark:hover:bg-red-500/10 dark:hover:text-red-400 dark:hover:ring-red-500/30`}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Supprimer
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center dark:border-slate-700 dark:bg-slate-800/60">
          <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-white text-emerald-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-emerald-400 dark:ring-slate-700">
            <ImagePlus className="h-4 w-4" aria-hidden="true" />
          </span>
          <p className="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            Ajouter une photo du ticket
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Compression automatique en 1600 px, qualité 0.8.
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={openGallery}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800"
            >
              <Images className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              Galerie
            </button>
            <button
              type="button"
              onClick={openCamera}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-500 px-3 text-xs font-semibold text-white shadow-sm shadow-emerald-500/20 transition-colors hover:bg-emerald-600"
            >
              <Camera className="h-4 w-4" aria-hidden="true" />
              Caméra
            </button>
          </div>
        </div>
      )}

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFileChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={handleFileChange}
      />
    </div>
  )
}
