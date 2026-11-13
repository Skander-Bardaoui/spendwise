import type { User } from '@supabase/supabase-js'

export function getInitials(name: string) {
  return name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

export function getUserDisplayName(user: User | null) {
  const metadataName = user?.user_metadata?.full_name

  if (typeof metadataName === 'string' && metadataName.trim() !== '') {
    return metadataName.trim()
  }

  return user?.email ?? 'Utilisateur'
}
