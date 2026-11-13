import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeftRight,
  Banknote,
  CreditCard,
  MoreHorizontal,
} from 'lucide-react'
import type { PaymentMethod } from '@/types/database'

export type PaymentMethodOption = {
  value: PaymentMethod
  label: string
  shortLabel: string
  icon: LucideIcon
}

export const PAYMENT_METHODS: PaymentMethodOption[] = [
  { value: 'card', label: 'Carte bancaire', shortLabel: 'Carte', icon: CreditCard },
  { value: 'cash', label: 'Espèces', shortLabel: 'Espèces', icon: Banknote },
  { value: 'transfer', label: 'Virement', shortLabel: 'Virement', icon: ArrowLeftRight },
  { value: 'other', label: 'Autre', shortLabel: 'Autre', icon: MoreHorizontal },
]

export function getPaymentMethod(value: PaymentMethod): PaymentMethodOption {
  return PAYMENT_METHODS.find((option) => option.value === value) ?? PAYMENT_METHODS[3]
}
