import { format, parseISO } from 'date-fns'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { getPaymentMethod } from '@/lib/paymentMethods'
import type { ExpenseFilters } from '@/services/expenses'
import type { ExpenseWithCategory } from '@/types/database'

export type ExpenseExportContext = {
  filters: ExpenseFilters
  categoryLabel: string | null
}

const amountFormatter = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 3,
})

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function formatAmount(amount: number) {
  // jsPDF (polices standard) ne rend pas les espaces fines insécables d'Intl.
  return amountFormatter.format(amount).replace(/[\u202f\u00a0]/g, ' ')
}

function roundAmount(amount: number) {
  return Math.round(amount * 1000) / 1000
}

function formatFullDate(isoDate: string) {
  return format(parseISO(`${isoDate}T00:00:00`), 'dd/MM/yyyy')
}

function buildPeriodLabel(filters: ExpenseFilters) {
  if (filters.dateFrom && filters.dateTo) {
    return `Du ${formatFullDate(filters.dateFrom)} au ${formatFullDate(filters.dateTo)}`
  }
  if (filters.dateFrom) {
    return `Depuis le ${formatFullDate(filters.dateFrom)}`
  }
  if (filters.dateTo) {
    return `Jusqu'au ${formatFullDate(filters.dateTo)}`
  }
  return 'Toutes les périodes'
}

function buildFiltersSummary(context: ExpenseExportContext) {
  const { filters, categoryLabel } = context
  const parts: string[] = []

  if (categoryLabel) parts.push(`Catégorie : ${categoryLabel}`)
  if (filters.paymentMethod) {
    parts.push(`Paiement : ${getPaymentMethod(filters.paymentMethod).label}`)
  }
  if (filters.minAmount !== null || filters.maxAmount !== null) {
    const min = filters.minAmount !== null ? formatAmount(filters.minAmount) : '0'
    const max =
      filters.maxAmount !== null ? formatAmount(filters.maxAmount) : 'illimité'
    parts.push(`Montant : ${min} à ${max} TND`)
  }
  if (filters.search.trim()) {
    parts.push(`Recherche : « ${filters.search.trim()} »`)
  }

  return parts.join('   •   ')
}

export function buildExportFileName(
  extension: 'xlsx' | 'pdf',
  date = new Date(),
) {
  const stamp = [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('')
  const time = [pad(date.getHours()), pad(date.getMinutes()), pad(date.getSeconds())].join('')
  return `spendwise-depenses-${stamp}-${time}.${extension}`
}

function buildCategorySummary(rows: ExpenseWithCategory[]) {
  const groups = new Map<string, { count: number; total: number }>()

  for (const row of rows) {
    const name = row.category?.name ?? 'Sans catégorie'
    const current = groups.get(name) ?? { count: 0, total: 0 }
    current.count += 1
    current.total = roundAmount(current.total + row.amount)
    groups.set(name, current)
  }

  return [...groups.entries()]
    .map(([name, group]) => ({
      name,
      count: group.count,
      total: group.total,
    }))
    .sort((a, b) => b.total - a.total)
}

export function exportExpensesToExcel(
  rows: ExpenseWithCategory[],
  context: ExpenseExportContext,
) {
  const totalAmount = roundAmount(
    rows.reduce((sum, row) => sum + row.amount, 0),
  )

  const expenseHeader = [
    'Date',
    'Commerçant',
    'Catégorie',
    'Moyen de paiement',
    'Montant (TND)',
    'Note',
  ]
  const expenseBody = rows.map((row) => [
    formatFullDate(row.expense_date),
    row.merchant,
    row.category?.name ?? 'Sans catégorie',
    getPaymentMethod(row.payment_method).label,
    row.amount,
    row.note ?? '',
  ])

  const expenseSheet = XLSX.utils.aoa_to_sheet([
    expenseHeader,
    ...expenseBody,
  ])
  expenseSheet['!cols'] = [
    { wch: 12 },
    { wch: 30 },
    { wch: 22 },
    { wch: 20 },
    { wch: 15 },
    { wch: 42 },
  ]
  expenseSheet['!autofilter'] = {
    ref: `A1:F${expenseBody.length + 1}`,
  }
  for (let rowIndex = 2; rowIndex <= expenseBody.length + 1; rowIndex += 1) {
    const cell = expenseSheet[`E${rowIndex}`]
    if (cell) cell.z = '#,##0.00'
  }

  const summaryBody = buildCategorySummary(rows)
  const summaryRows = summaryBody.map((group) => [
    group.name,
    group.count,
    group.total,
    totalAmount > 0 ? Number(((group.total / totalAmount) * 100).toFixed(1)) : 0,
  ])
  const summarySheet = XLSX.utils.aoa_to_sheet([
    ['Catégorie', 'Nombre de dépenses', 'Total (TND)', 'Part (%)'],
    ...summaryRows,
    ['Total', rows.length, totalAmount, totalAmount > 0 ? 100 : 0],
  ])
  summarySheet['!cols'] = [
    { wch: 26 },
    { wch: 20 },
    { wch: 16 },
    { wch: 12 },
  ]
  for (let rowIndex = 2; rowIndex <= summaryRows.length + 2; rowIndex += 1) {
    const amountCell = summarySheet[`C${rowIndex}`]
    if (amountCell) amountCell.z = '#,##0.00'
    const partCell = summarySheet[`D${rowIndex}`]
    if (partCell) partCell.z = '0.0'
  }

  const workbook = XLSX.utils.book_new()
  workbook.Props = {
    Title: 'Dépenses filtrées',
    Subject: buildPeriodLabel(context.filters),
    Author: 'SpendWise',
    Comments: buildFiltersSummary(context),
    CreatedDate: new Date(),
  }
  XLSX.utils.book_append_sheet(workbook, expenseSheet, 'Dépenses')
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Résumé par catégorie')
  XLSX.writeFile(workbook, buildExportFileName('xlsx'))
}

export function exportExpensesToPdf(
  rows: ExpenseWithCategory[],
  context: ExpenseExportContext,
) {
  const totalAmount = roundAmount(
    rows.reduce((sum, row) => sum + row.amount, 0),
  )
  const period = buildPeriodLabel(context.filters)
  const filtersSummary = buildFiltersSummary(context)
  const generatedAt = format(new Date(), 'dd/MM/yyyy HH:mm')

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const marginX = 14

  doc.setFillColor(16, 185, 129)
  doc.rect(0, 0, pageWidth, 26, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text('SpendWise', marginX, 11)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text('Dépenses filtrées', marginX, 18)
  doc.setFontSize(8.5)
  doc.text(period, pageWidth - marginX, 11, { align: 'right' })
  doc.text(`Généré le ${generatedAt}`, pageWidth - marginX, 18, {
    align: 'right',
  })

  let startY = 32
  if (filtersSummary) {
    doc.setTextColor(71, 85, 105)
    doc.setFontSize(8.5)
    const summaryLines = doc.splitTextToSize(
      filtersSummary,
      pageWidth - marginX * 2,
    )
    doc.text(summaryLines, marginX, startY)
    startY += summaryLines.length * 4 + 2
  }

  const body = rows.map((row) => [
    formatFullDate(row.expense_date),
    row.merchant,
    row.category?.name ?? 'Sans catégorie',
    getPaymentMethod(row.payment_method).shortLabel,
    row.note ?? '',
    formatAmount(row.amount),
  ])

  autoTable(doc, {
    startY,
    head: [
      ['Date', 'Commerçant', 'Catégorie', 'Paiement', 'Note', 'Montant (TND)'],
    ],
    body,
    foot: [['', '', '', '', 'Total', formatAmount(totalAmount)]],
    showFoot: 'lastPage',
    theme: 'grid',
    margin: { top: 30, right: marginX, bottom: 18, left: marginX },
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    alternateRowStyles: {
      fillColor: [240, 253, 244],
    },
    footStyles: {
      fillColor: [209, 250, 229],
      textColor: [6, 78, 59],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 52 },
      2: { cellWidth: 38 },
      3: { cellWidth: 26 },
      5: { cellWidth: 28, halign: 'right' },
    },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.setTextColor(71, 85, 105)
        doc.text('SpendWise — Dépenses filtrées', marginX, 12)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100, 116, 139)
        doc.text(period, pageWidth - marginX, 12, { align: 'right' })
        doc.setDrawColor(226, 232, 240)
        doc.setLineWidth(0.3)
        doc.line(marginX, 16, pageWidth - marginX, 16)
      }
    },
  })

  const pageCount = doc.getNumberOfPages()
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text(
      `SpendWise — ${rows.length} dépense${rows.length > 1 ? 's' : ''} — ${period}`,
      marginX,
      pageHeight - 8,
    )
    doc.text(`Page ${page} / ${pageCount}`, pageWidth - marginX, pageHeight - 8, {
      align: 'right',
    })
  }

  doc.save(buildExportFileName('pdf'))
}
