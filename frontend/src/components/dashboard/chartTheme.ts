import type { CSSProperties } from 'react'

export const chartTooltipContentStyle: CSSProperties = {
  backgroundColor: 'var(--sw-tooltip-bg)',
  border: '1px solid var(--sw-tooltip-border)',
  borderRadius: '12px',
  boxShadow: '0 12px 32px rgba(15, 23, 42, 0.16)',
  color: 'var(--sw-tooltip-text)',
  fontSize: '12px',
  padding: '8px 12px',
}

export const chartTooltipLabelStyle: CSSProperties = {
  color: 'var(--sw-tooltip-muted)',
  fontSize: '11px',
  marginBottom: '4px',
}

export const chartTooltipItemStyle: CSSProperties = {
  color: 'var(--sw-tooltip-text)',
  fontSize: '12px',
  fontWeight: 600,
}

export const chartAxisTick = {
  fill: 'var(--sw-chart-axis)',
  fontSize: 11,
}
