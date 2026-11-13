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
}

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
