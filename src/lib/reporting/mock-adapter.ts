/**
 * Server-side mock adapter for the reporting agent.
 *
 * When REPORTING_MOCK=true (or SAGE_ODBC_DSN is unset), the Jarvis API routes
 * call these functions directly instead of proxying to the Python sidecar.
 * No sidecar process needed for local development.
 *
 * All query helpers delegate to sage-data.ts which reads sage-mock-data.json.
 */
import 'server-only'
import {
  queryArAging,
  queryRevenueByCustomer,
  queryRevenueByProductLine,
  queryGrossProfitByCustomer,
  queryApAging,
  querySalesOrderBacklog,
  queryItemUnitSalesHistory,
} from '@/lib/data/sage-data'
import type { ReportSpec } from '@reporting/lib/types'

export function isMockMode(): boolean {
  return (
    process.env.REPORTING_MOCK === 'true' ||
    !process.env.SAGE_ODBC_DSN
  )
}

// ── Preset metadata (mirrors Python allowed_fields.py PRESETS) ───────────────

export const PRESET_DEFINITIONS = [
  {
    slug: 'ar-aging',
    title: 'AR Aging',
    description: 'Accounts receivable aging by customer — buckets at 30, 60, 90, 120+ days.',
    param_schema: {
      as_of_date: { type: 'date', label: 'As of Date', required: true },
    },
  },
  {
    slug: 'revenue-by-customer',
    title: 'Revenue by Customer',
    description: 'Total invoiced revenue per customer for a date range.',
    param_schema: {
      start_date: { type: 'date', label: 'Start Date', required: true },
      end_date:   { type: 'date', label: 'End Date',   required: true },
    },
  },
  {
    slug: 'revenue-by-product-line',
    title: 'Revenue by Product Line',
    description: 'Invoiced revenue broken down by product line for a date range.',
    param_schema: {
      start_date: { type: 'date', label: 'Start Date', required: true },
      end_date:   { type: 'date', label: 'End Date',   required: true },
    },
  },
  {
    slug: 'gross-profit-by-customer',
    title: 'Gross Profit by Customer',
    description: 'Revenue, cost, gross profit, and margin % per customer.',
    param_schema: {
      start_date: { type: 'date', label: 'Start Date', required: true },
      end_date:   { type: 'date', label: 'End Date',   required: true },
    },
  },
  {
    slug: 'ap-aging',
    title: 'AP Aging',
    description: 'Accounts payable aging by vendor — buckets at 30, 60, 90, 120+ days.',
    param_schema: {
      as_of_date: { type: 'date', label: 'As of Date', required: true },
    },
  },
  {
    slug: 'sales-order-backlog',
    title: 'Sales Order Backlog',
    description: 'Open sales order value by customer.',
    param_schema: {
      as_of_date: { type: 'date', label: 'As of Date', required: true },
    },
  },
  {
    slug: 'item-unit-sales-history',
    title: 'Item Unit Sales History',
    description: 'Units sold per item by calendar year — mirrors the Sage 100 Item Unit Sales History Report.',
    param_schema: {
      start_year: { type: 'string', label: 'Start Year (e.g. 2013)', required: true },
      end_year:   { type: 'string', label: 'End Year (e.g. 2016)',   required: true },
    },
  },
]

// ── Preset runner ─────────────────────────────────────────────────────────────

export function runPreset(slug: string, params: Record<string, string>) {
  const today = new Date().toISOString().slice(0, 10)

  switch (slug) {
    case 'ar-aging':
      return queryArAging(params.as_of_date ?? today)
    case 'revenue-by-customer':
      return queryRevenueByCustomer(params.start_date ?? today, params.end_date ?? today)
    case 'revenue-by-product-line':
      return queryRevenueByProductLine(params.start_date ?? today, params.end_date ?? today)
    case 'gross-profit-by-customer':
      return queryGrossProfitByCustomer(params.start_date ?? today, params.end_date ?? today)
    case 'ap-aging':
      return queryApAging(params.as_of_date ?? today)
    case 'sales-order-backlog':
      return querySalesOrderBacklog(params.as_of_date ?? today)
    case 'item-unit-sales-history':
      return queryItemUnitSalesHistory(params.start_year ?? '2013', params.end_year ?? '2016')
    default:
      throw new Error(`Unknown preset slug: '${slug}'`)
  }
}

// ── Custom ReportSpec executor (TS-side) ──────────────────────────────────────

import {
  arInvoiceHeaders,
  arInvoiceDetails,
  arCustomers,
  soSalesOrderHeaders,
  soSalesOrderDetails,
  apInvoiceHeaders,
  apVendorMasters,
  imItemMaster,
} from '@/lib/data/sage-data'

type DataRow = Record<string, string | number | null>

const TABLE_MAP: Record<string, DataRow[]> = {
  AR_Customer:         arCustomers         as unknown as DataRow[],
  AR_InvoiceHeader:    arInvoiceHeaders    as unknown as DataRow[],
  AR_InvoiceDetail:    arInvoiceDetails    as unknown as DataRow[],
  SO_SalesOrderHeader: soSalesOrderHeaders as unknown as DataRow[],
  SO_SalesOrderDetail: soSalesOrderDetails as unknown as DataRow[],
  AP_VendorMaster:     apVendorMasters     as unknown as DataRow[],
  AP_InvoiceHeader:    apInvoiceHeaders    as unknown as DataRow[],
  IM_ItemMaster:       imItemMaster        as unknown as DataRow[],
}

export function runCustom(spec: ReportSpec): DataRow[] {
  const primaryTable = spec.data_sources[0]
  if (!TABLE_MAP[primaryTable]) {
    throw new Error(`Table '${primaryTable}' not available in mock data.`)
  }

  let rows: DataRow[] = [...TABLE_MAP[primaryTable]]

  // Apply filters
  for (const f of spec.filters ?? []) {
    const field = f.field.includes('.') ? f.field.split('.').pop()! : f.field
    const val = f.value
    rows = rows.filter((row) => {
      const rv = row[field]
      if (rv === null || rv === undefined) return false
      switch (f.op) {
        case '=':       return rv === val
        case '>':       return rv > (val as number)
        case '>=':      return rv >= (val as number)
        case '<':       return rv < (val as number)
        case '<=':      return rv <= (val as number)
        case 'LIKE':    return String(rv).toLowerCase().includes(String(val).replace(/%/g, '').toLowerCase())
        case 'IN':      return (val as string[]).includes(String(rv))
        case 'BETWEEN': return rv >= (val as string[])[0] && rv <= (val as string[])[1]
        default:        return true
      }
    })
  }

  const fields     = spec.fields
  const groupBy    = spec.group_by ?? []
  const limit      = Math.min(spec.limit ?? 500, 1000)
  const sortBy     = spec.sort_by
  const sortDesc   = (spec.sort_direction ?? 'desc') === 'desc'
  const hasAgg     = fields.some((f) => f.aggregate)

  // Simple projection
  if (!hasAgg && groupBy.length === 0) {
    let result = rows.slice(0, limit).map((row) => {
      const out: DataRow = {}
      for (const f of fields) out[f.alias] = (row[f.field] ?? null) as string | number | null
      return out
    })
    if (sortBy) result.sort((a, b) => compareVals(a[sortBy], b[sortBy], sortDesc))
    return result
  }

  // Group + aggregate
  const aliasToField = Object.fromEntries(fields.map((f) => [f.alias, f.field]))
  const groupFields  = groupBy.map((alias) => ({ alias, field: aliasToField[alias] ?? alias }))
  const aggFields    = fields.filter((f) => f.aggregate)

  const groups = new Map<string, { row: DataRow; vals: Record<string, number[]> }>()

  for (const row of rows) {
    const key = groupFields.map((g) => String(row[g.field] ?? '')).join('|')
    if (!groups.has(key)) {
      const seed: DataRow = {}
      for (const g of groupFields) seed[g.alias] = row[g.field] ?? null
      groups.set(key, { row: seed, vals: Object.fromEntries(aggFields.map((f) => [f.alias, []])) })
    }
    const entry = groups.get(key)!
    for (const f of aggFields) {
      const v = row[f.field]
      if (typeof v === 'number') entry.vals[f.alias].push(v)
    }
  }

  let result = Array.from(groups.values()).map(({ row, vals }) => {
    const out: DataRow = { ...row }
    for (const f of aggFields) {
      const v = vals[f.alias]
      switch (f.aggregate) {
        case 'SUM':            out[f.alias] = round(v.reduce((a, b) => a + b, 0)); break
        case 'COUNT':          out[f.alias] = v.length; break
        case 'COUNT_DISTINCT': out[f.alias] = new Set(v).size; break
        case 'AVG':            out[f.alias] = v.length ? round(v.reduce((a, b) => a + b, 0) / v.length) : 0; break
        case 'MIN':            out[f.alias] = v.length ? Math.min(...v) : null; break
        case 'MAX':            out[f.alias] = v.length ? Math.max(...v) : null; break
      }
    }
    // Computed fields
    for (const cf of spec.computed_fields ?? []) {
      try {
        // eslint-disable-next-line no-new-func
        out[cf.alias] = round(new Function(...Object.keys(out), `return ${cf.expression}`)(...Object.values(out)) as number)
      } catch {
        out[cf.alias] = null
      }
    }
    return out
  })

  if (sortBy) result.sort((a, b) => compareVals(a[sortBy], b[sortBy], sortDesc))
  return result.slice(0, limit)
}

function round(n: number): number { return Math.round(n * 10000) / 10000 }

function compareVals(a: unknown, b: unknown, desc: boolean): number {
  if (a === null || a === undefined) return 1
  if (b === null || b === undefined) return -1
  const cmp = a < b ? -1 : a > b ? 1 : 0
  return desc ? -cmp : cmp
}
