type AuthErrorLike = {
  code?: string
  message?: string
  status?: number
}

const fallbackMessage =
  'Une erreur inattendue est survenue. Veuillez réessayer.'

const codeMessages: Record<string, string> = {
  invalid_credentials: 'Adresse email ou mot de passe incorrect.',
  email_not_confirmed:
    'Votre adresse email n’a pas encore été confirmée. Consultez votre boîte mail.',
  user_already_exists: 'Un compte existe déjà avec cette adresse email.',
  email_exists: 'Un compte existe déjà avec cette adresse email.',
  weak_password:
    'Le mot de passe est trop faible. Utilisez au moins 8 caractères.',
  same_password:
    'Le nouveau mot de passe doit être différent du précédent.',
  email_address_invalid: 'Cette adresse email n’est pas valide.',
  signup_disabled: 'Les inscriptions sont temporairement désactivées.',
  email_provider_disabled:
    'La connexion par email est temporairement désactivée.',
  over_email_send_rate_limit:
    'Trop d’emails envoyés. Réessayez dans quelques minutes.',
  over_request_rate_limit:
    'Trop de tentatives. Réessayez dans quelques minutes.',
  validation_failed: 'Les informations saisies ne sont pas valides.',
  session_not_found: 'Votre session a expiré. Veuillez vous reconnecter.',
  refresh_token_not_found:
    'Votre session a expiré. Veuillez vous reconnecter.',
  user_not_found: 'Aucun compte ne correspond à ces informations.',
  no_authorization: 'Vous n’êtes pas autorisé à effectuer cette action.',
}

const messageMatchers: Array<[RegExp, string]> = [
  [
    /invalid login credentials/i,
    'Adresse email ou mot de passe incorrect.',
  ],
  [
    /email not confirmed/i,
    'Votre adresse email n’a pas encore été confirmée. Consultez votre boîte mail.',
  ],
  [
    /user already registered|already been registered/i,
    'Un compte existe déjà avec cette adresse email.',
  ],
  [
    /password should be at least|weak password/i,
    'Le mot de passe doit contenir au moins 8 caractères.',
  ],
  [
    /rate limit|too many requests/i,
    'Trop de tentatives. Réessayez dans quelques minutes.',
  ],
  [
    /failed to fetch|networkerror|network request failed/i,
    'Impossible de contacter le serveur. Vérifiez votre connexion internet.',
  ],
  [
    /invalid email/i,
    'Cette adresse email n’est pas valide.',
  ],
  [
    /signups? not allowed/i,
    'Les inscriptions sont temporairement désactivées.',
  ],
]

export function getAuthErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const { code, message, status } = error as AuthErrorLike

    if (code && codeMessages[code]) {
      return codeMessages[code]
    }

    if (message) {
      const match = messageMatchers.find(([pattern]) => pattern.test(message))
      if (match) {
        return match[1]
      }
    }

    if (status === 429) {
      return 'Trop de tentatives. Réessayez dans quelques minutes.'
    }

    if (typeof status === 'number' && status >= 500) {
      return 'Le service d’authentification est momentanément indisponible. Réessayez plus tard.'
    }
  }

  return fallbackMessage
}
