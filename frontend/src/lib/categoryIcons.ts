import type { LucideIcon } from 'lucide-react'
import {
  Car,
  CircleHelp,
  Gamepad2,
  HeartPulse,
  House,
  Receipt,
  Tag,
  Utensils,
} from 'lucide-react'

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  utensils: Utensils,
  car: Car,
  'heart-pulse': HeartPulse,
  'gamepad-2': Gamepad2,
  house: House,
  receipt: Receipt,
  'circle-help': CircleHelp,
  tag: Tag,
}

export const CATEGORY_ICON_OPTIONS = [
  { value: 'utensils', label: 'Repas' },
  { value: 'car', label: 'Transport' },
  { value: 'heart-pulse', label: 'Santé' },
  { value: 'gamepad-2', label: 'Loisirs' },
  { value: 'house', label: 'Logement' },
  { value: 'receipt', label: 'Factures' },
  { value: 'tag', label: 'Étiquette' },
  { value: 'circle-help', label: 'Autre' },
]

export const CATEGORY_COLOR_OPTIONS = [
  '#F59E0B',
  '#3B82F6',
  '#EF4444',
  '#8B5CF6',
  '#10B981',
  '#6366F1',
  '#64748B',
  '#EC4899',
  '#14B8A6',
  '#F97316',
]

export function getCategoryIcon(icon: string | null) {
  return (icon && CATEGORY_ICONS[icon]) || Tag
}

export function getCategoryColors(color: string | null) {
  const safeColor = color ?? '#64748B'
  return {
    text: safeColor,
    background: `${safeColor}1A`,
    border: `${safeColor}33`,
  }
}
