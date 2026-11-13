export type CompressionOptions = {
  maxSize?: number
  quality?: number
}

const DEFAULTS: Required<CompressionOptions> = {
  maxSize: 1600,
  quality: 0.8,
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Impossible de lire cette image.'))
    }

    image.src = url
  })
}

/**
 * Redimensionne l'image pour tenir dans `maxSize` px (plus grand côté) puis
 * la réencode en JPEG qualité `quality`. Le résultat est toujours un JPEG.
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {},
): Promise<File> {
  const { maxSize, quality } = { ...DEFAULTS, ...options }

  if (!file.type.startsWith('image/')) {
    throw new Error('Le fichier sélectionné n’est pas une image.')
  }

  const image = await loadImage(file)
  const sourceWidth = image.naturalWidth || image.width
  const sourceHeight = image.naturalHeight || image.height

  if (!sourceWidth || !sourceHeight) {
    throw new Error('Impossible de lire les dimensions de l’image.')
  }

  const scale = Math.min(1, maxSize / Math.max(sourceWidth, sourceHeight))
  const width = Math.max(1, Math.round(sourceWidth * scale))
  const height = Math.max(1, Math.round(sourceHeight * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('La compression d’image n’est pas disponible.')
  }

  // JPEG ne gère pas la transparence : on aplatit sur fond blanc.
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(image, 0, 0, width, height)

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', quality)
  })

  if (!blob) {
    throw new Error('La compression de l’image a échoué.')
  }

  const baseName = file.name.replace(/\.[^.]+$/, '') || 'justificatif'

  return new File([blob], `${baseName}.jpg`, {
    type: 'image/jpeg',
    lastModified: Date.now(),
  })
}
