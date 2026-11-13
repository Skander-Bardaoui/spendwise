import { supabase } from '@/lib/supabase'
import { compressImage } from '@/lib/imageCompression'

const BUCKET = 'receipts'

/** Durée de validité des URLs signées : 1 heure. */
export const SIGNED_URL_TTL_SECONDS = 60 * 60

export const receiptKeys = {
  all: ['receipts'] as const,
  signedUrl: (path: string) =>
    [...receiptKeys.all, 'signed-url', path] as const,
}

async function requireUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Vous devez être connecté pour envoyer un justificatif.')
  }

  return user.id
}

/**
 * Compresse l'image (max 1600 px, qualité 0.8), l'envoie dans le bucket privé
 * `receipts` sous `{user_id}/{uuid}.jpg` et renvoie le chemin de stockage.
 */
export async function uploadReceipt(file: File): Promise<string> {
  const userId = await requireUserId()
  const compressed = await compressImage(file, { maxSize: 1600, quality: 0.8 })
  const path = `${userId}/${crypto.randomUUID()}.jpg`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, compressed, {
      contentType: 'image/jpeg',
      cacheControl: String(SIGNED_URL_TTL_SECONDS),
      upsert: false,
    })

  if (error) {
    throw new Error(
      error.message || 'Impossible d’envoyer le justificatif.',
    )
  }

  return path
}

export async function getSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS)

  if (error || !data?.signedUrl) {
    throw new Error(
      error?.message || 'Impossible de charger le justificatif.',
    )
  }

  return data.signedUrl
}

export async function deleteReceipt(path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([path])

  if (error) {
    throw new Error(
      error.message || 'Impossible de supprimer le justificatif.',
    )
  }
}
