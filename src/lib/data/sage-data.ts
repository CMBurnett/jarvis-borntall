/**
 * Sage 100 mock data layer.
 *
 * Exports typed arrays mirroring real Sage 100 ODBC table/column names, plus
 * query helpers that replicate the 6 preset reports and the customer-context
 * lookup used by the order-processing sidecar.
 *
 * Usage:
 *   import { getSageCustomerContext, getSkuCatalog, queryArAging } from '@/lib/data/sage-data'
 *
 * The raw table arrays are also exported for direct use in AI-chat context or
 * any component that needs to read the full dataset.
 */

import rawData from './sage-mock-data.json'
import type { SageCustomerContext } from '@order-processing/lib/types'

// ─── Row interfaces (field names match Sage 100 ODBC schema) ─────────────────

export interface ArCustomerRow {
  ARDivisionNo: string
  CustomerNo: string
  CustomerName: string
  AddressLine1: string
  City: string
  State: string
  ZipCode: string
  TelephoneNo: string
  EmailAddress: string
  CreditLimit: number
  CurrentBalance: number
  PriceLevel: string
  TermsCode: string
  SalespersonNo: string
  InactiveReasonCode: string | null
}

export interface ImItemMasterRow {
  ItemCode: string
  ItemCodeDesc: string
  ProductLine: string
  StandardUnitOfMeasure: string
  StandardCost: number
  LastTotalUnitCost: number
  SuggestedRetailPrice: number
  QuantityOnHand: number
  QuantityOnSalesOrder: number
  QuantityOnPurchaseOrder: number
  InactiveItem: 'Y' | 'N'
  WarehouseCode: string
}

export interface SoSalesOrderHeaderRow {
  SalesOrderNo: string
  OrderDate: string
  ShipDate: string
  ARDivisionNo: string
  CustomerNo: string
  BillToName: string
  ShipToName: string
  SalespersonNo: string
  OrderStatus: string
  TaxableAmt: number
  NonTaxableAmt: number
  SalesTaxAmt: number
  FreightAmt: number
}

export interface SoSalesOrderDetailRow {
  SalesOrderNo: string
  LineKey: string
  ItemCode: string
  ItemCodeDesc: string
  QuantityOrdered: number
  QuantityShipped: number
  QuantityBackordered: number
  UnitPrice: number
  UnitCost: number
  ExtensionAmt: number
  ProductLine: string
  WarehouseCode: string
}

export interface ArInvoiceHeaderRow {
  InvoiceNo: string
  InvoiceDate: string
  DueDate: string
  ARDivisionNo: string
  CustomerNo: string
  BillToName: string
  SalespersonNo: string
  TaxableAmt: number
  NonTaxableAmt: number
  SalesTaxAmt: number
  FreightAmt: number
  InvoiceAmt: number
  Balance: number
  PaymentType: string
  InvoiceType: string
}

export interface ArInvoiceDetailRow {
  InvoiceNo: string
  ARDivisionNo: string
  CustomerNo: string
  ItemCode: string
  ItemCodeDesc: string
  QuantityShipped: number
  UnitPrice: number
  ExtensionAmt: number
  UnitCost: number
  CommentText: string | null
  ProductLine: string
  WarehouseCode: string
}

export interface ApVendorMasterRow {
  VendorNo: string
  VendorName: string
  AddressLine1: string
  City: string
  State: string
  ZipCode: string
  TelephoneNo: string
  EmailAddress: string
  TermsCode: string
  VendorStatus: string
}

export interface ApInvoiceHeaderRow {
  InvoiceNo: string
  InvoiceDate: string
  DueDate: string
  VendorNo: string
  PurchaseOrderNo: string
  InvoiceAmt: number
  Balance: number
  CheckAmt: number
  DiscountAmt: number
  APDivisionNo: string
  TransactionStatus: string
}

export interface ImItemSalesHistoryRow {
  ItemCode: string
  ItemCodeDesc: string
  Year: number
  QtyShipped: number
}

// ─── Raw table exports ────────────────────────────────────────────────────────

export const arCustomers = rawData.AR_Customer as ArCustomerRow[]
export const imItemMaster = rawData.IM_ItemMaster as ImItemMasterRow[]
export const imItemSalesHistory = (rawData as unknown as { IM_ItemSalesHistory: ImItemSalesHistoryRow[] }).IM_ItemSalesHistory
export const soSalesOrderHeaders = rawData.SO_SalesOrderHeader as SoSalesOrderHeaderRow[]
export const soSalesOrderDetails = rawData.SO_SalesOrderDetail as SoSalesOrderDetailRow[]
export const arInvoiceHeaders = rawData.AR_InvoiceHeader as ArInvoiceHeaderRow[]
export const arInvoiceDetails = rawData.AR_InvoiceDetail as ArInvoiceDetailRow[]
export const apVendorMasters = rawData.AP_VendorMaster as ApVendorMasterRow[]
export const apInvoiceHeaders = rawData.AP_InvoiceHeader as ApInvoiceHeaderRow[]

// ─── Order-processing helpers ─────────────────────────────────────────────────

/**
 * Fuzzy customer lookup + recent order history.
 * Replicates the response shape of the Python ODBC sidecar at GET /sage/customer/:name.
 */
export function getSageCustomerContext(customerName: string): SageCustomerContext {
  const query = customerName.toLowerCase()
  const customer = arCustomers.find((c) =>
    c.CustomerName.toLowerCase().includes(query)
  )

  if (!customer) {
    return { customer_no: null, customer_name: customerName, recent_orders: [] }
  }

  const customerKey = `${customer.ARDivisionNo}-${customer.CustomerNo}`

  const recentOrders = soSalesOrderHeaders
    .filter((h) => h.ARDivisionNo === customer.ARDivisionNo && h.CustomerNo === customer.CustomerNo)
    .sort((a, b) => b.OrderDate.localeCompare(a.OrderDate))
    .slice(0, 10)
    .map((h) => {
      const lines = soSalesOrderDetails
        .filter((d) => d.SalesOrderNo === h.SalesOrderNo)
        .map((d) => ({
          item_code: d.ItemCode,
          description: d.ItemCodeDesc,
          quantity: d.QuantityOrdered,
          unit: d.UnitPrice.toString(),
        }))
      return {
        order_no: h.SalesOrderNo,
        order_date: h.OrderDate,
        customer_no: customerKey,
        customer_name: customer.CustomerName,
        line_items: lines,
      }
    })

  return {
    customer_no: customerKey,
    customer_name: customer.CustomerName,
    recent_orders: recentOrders,
  }
}

/**
 * Active SKU list formatted for op_sku_catalog seeding.
 * Replicates the response of the Python sidecar at GET /sage/sku-catalog.
 */
export function getSkuCatalog() {
  return imItemMaster
    .filter((item) => item.InactiveItem === 'N')
    .map((item) => ({
      sku: item.ItemCode,
      name: item.ItemCodeDesc,
      description: item.ProductLine ?? null,
      unit: item.StandardUnitOfMeasure ?? null,
      active: true,
    }))
}

// ─── Reporting preset helpers ─────────────────────────────────────────────────

function daysBetween(dateStr: string, asOfStr: string): number {
  return Math.floor(
    (new Date(asOfStr).getTime() - new Date(dateStr).getTime()) / 86_400_000
  )
}

function agingBucket(daysOverdue: number): string {
  if (daysOverdue <= 0) return 'Current'
  if (daysOverdue <= 30) return '1-30'
  if (daysOverdue <= 60) return '31-60'
  if (daysOverdue <= 90) return '61-90'
  if (daysOverdue <= 120) return '91-120'
  return '120+'
}

/** AR aging by customer as of a given date, bucketed at 30/60/90/120+ days. */
export function queryArAging(asOfDate: string) {
  const customerMap = Object.fromEntries(
    arCustomers.map((c) => [`${c.ARDivisionNo}-${c.CustomerNo}`, c.CustomerName])
  )
  return arInvoiceHeaders
    .filter((h) => h.Balance > 0 && h.InvoiceDate <= asOfDate)
    .map((h) => {
      const daysOverdue = daysBetween(h.DueDate, asOfDate)
      return {
        CustomerName: customerMap[`${h.ARDivisionNo}-${h.CustomerNo}`] ?? h.BillToName,
        InvoiceNo: h.InvoiceNo,
        InvoiceDate: h.InvoiceDate,
        DueDate: h.DueDate,
        Balance: h.Balance,
        DaysOverdue: daysOverdue,
        AgingBucket: agingBucket(daysOverdue),
      }
    })
    .sort((a, b) => a.CustomerName.localeCompare(b.CustomerName) || a.DueDate.localeCompare(b.DueDate))
}

/** Total invoiced revenue per customer for a date range. */
export function queryRevenueByCustomer(startDate: string, endDate: string) {
  const customerMap = Object.fromEntries(
    arCustomers.map((c) => [`${c.ARDivisionNo}-${c.CustomerNo}`, c.CustomerName])
  )
  const totals: Record<string, { CustomerName: string; CustomerNo: string; TotalRevenue: number; InvoiceCount: number }> = {}

  for (const h of arInvoiceHeaders) {
    if (h.InvoiceDate < startDate || h.InvoiceDate > endDate) continue
    const key = `${h.ARDivisionNo}-${h.CustomerNo}`
    if (!totals[key]) {
      totals[key] = { CustomerName: customerMap[key] ?? h.BillToName, CustomerNo: h.CustomerNo, TotalRevenue: 0, InvoiceCount: 0 }
    }
    totals[key].TotalRevenue += h.TaxableAmt + h.NonTaxableAmt
    totals[key].InvoiceCount += 1
  }

  return Object.values(totals).sort((a, b) => b.TotalRevenue - a.TotalRevenue)
}

/** Invoiced revenue broken down by product line for a date range. */
export function queryRevenueByProductLine(startDate: string, endDate: string) {
  const validInvoiceNos = new Set(
    arInvoiceHeaders
      .filter((h) => h.InvoiceDate >= startDate && h.InvoiceDate <= endDate)
      .map((h) => h.InvoiceNo)
  )

  const totals: Record<string, { ProductLine: string; TotalRevenue: number; InvoiceCount: number; TotalQty: number }> = {}

  for (const d of arInvoiceDetails) {
    if (!validInvoiceNos.has(d.InvoiceNo)) continue
    const pl = d.ProductLine ?? 'Unassigned'
    if (!totals[pl]) totals[pl] = { ProductLine: pl, TotalRevenue: 0, InvoiceCount: 0, TotalQty: 0 }
    totals[pl].TotalRevenue += d.ExtensionAmt
    totals[pl].TotalQty += d.QuantityShipped
  }

  // Count distinct invoices per product line
  for (const d of arInvoiceDetails) {
    if (!validInvoiceNos.has(d.InvoiceNo)) continue
    const pl = d.ProductLine ?? 'Unassigned'
    if (totals[pl]) totals[pl].InvoiceCount++
  }

  return Object.values(totals).sort((a, b) => b.TotalRevenue - a.TotalRevenue)
}

/** Revenue, cost, gross profit, and margin % per customer. */
export function queryGrossProfitByCustomer(startDate: string, endDate: string) {
  const validInvoiceNos = new Set(
    arInvoiceHeaders
      .filter((h) => h.InvoiceDate >= startDate && h.InvoiceDate <= endDate)
      .map((h) => h.InvoiceNo)
  )
  const customerMap = Object.fromEntries(
    arCustomers.map((c) => [`${c.ARDivisionNo}-${c.CustomerNo}`, c.CustomerName])
  )

  const totals: Record<string, { CustomerName: string; Revenue: number; COGS: number }> = {}

  for (const d of arInvoiceDetails) {
    if (!validInvoiceNos.has(d.InvoiceNo)) continue
    const hdr = arInvoiceHeaders.find((h) => h.InvoiceNo === d.InvoiceNo)
    if (!hdr) continue
    const key = `${hdr.ARDivisionNo}-${hdr.CustomerNo}`
    const name = customerMap[key] ?? hdr.BillToName
    if (!totals[key]) totals[key] = { CustomerName: name, Revenue: 0, COGS: 0 }
    totals[key].Revenue += d.ExtensionAmt
    totals[key].COGS += d.UnitCost * d.QuantityShipped
  }

  return Object.values(totals)
    .map((t) => ({
      CustomerName: t.CustomerName,
      Revenue: t.Revenue,
      COGS: t.COGS,
      GrossProfit: t.Revenue - t.COGS,
      GrossMarginPct: t.Revenue > 0 ? Math.round(((t.Revenue - t.COGS) / t.Revenue) * 10000) / 100 : 0,
    }))
    .sort((a, b) => b.GrossProfit - a.GrossProfit)
}

/** AP aging by vendor as of a given date, bucketed at 30/60/90/120+ days. */
export function queryApAging(asOfDate: string) {
  const vendorMap = Object.fromEntries(
    apVendorMasters.map((v) => [v.VendorNo, v.VendorName])
  )
  return apInvoiceHeaders
    .filter((h) => h.Balance > 0 && h.InvoiceDate <= asOfDate)
    .map((h) => {
      const daysOverdue = daysBetween(h.DueDate, asOfDate)
      return {
        VendorName: vendorMap[h.VendorNo] ?? h.VendorNo,
        InvoiceNo: h.InvoiceNo,
        InvoiceDate: h.InvoiceDate,
        DueDate: h.DueDate,
        Balance: h.Balance,
        DaysOverdue: daysOverdue,
        AgingBucket: agingBucket(daysOverdue),
      }
    })
    .sort((a, b) => a.VendorName.localeCompare(b.VendorName) || a.DueDate.localeCompare(b.DueDate))
}

/** Item unit sales history, pivoted by calendar year. Mirrors the Sage 100 Item Unit Sales History Report.
 *  startYear / endYear are 4-digit year strings (e.g. "2013", "2016").
 *  Returns one row per item with Qty_YYYY columns + TotalQty, sorted by TotalQty desc.
 */
export function queryItemUnitSalesHistory(startYear: string, endYear: string) {
  const start = parseInt(startYear, 10)
  const end   = parseInt(endYear,   10)

  const items: Record<string, { ItemCode: string; ItemCodeDesc: string; years: Record<number, number> }> = {}

  for (const row of imItemSalesHistory) {
    if (row.Year < start || row.Year > end) continue
    if (!items[row.ItemCode]) {
      items[row.ItemCode] = { ItemCode: row.ItemCode, ItemCodeDesc: row.ItemCodeDesc, years: {} }
    }
    items[row.ItemCode].years[row.Year] = (items[row.ItemCode].years[row.Year] ?? 0) + row.QtyShipped
  }

  const yearRange: number[] = []
  for (let y = start; y <= end; y++) yearRange.push(y)

  return Object.values(items)
    .map((item) => {
      const out: Record<string, string | number> = { ItemCode: item.ItemCode, ItemCodeDesc: item.ItemCodeDesc }
      let total = 0
      for (const y of yearRange) {
        const qty = item.years[y] ?? 0
        out[`Qty_${y}`] = qty
        total += qty
      }
      out.TotalQty = total
      return out
    })
    .filter((r) => (r.TotalQty as number) > 0)
    .sort((a, b) => (b.TotalQty as number) - (a.TotalQty as number))
}

/** Open sales order value by customer (open/backordered orders on or before asOfDate). */
export function querySalesOrderBacklog(asOfDate: string) {
  const customerMap = Object.fromEntries(
    arCustomers.map((c) => [`${c.ARDivisionNo}-${c.CustomerNo}`, c.CustomerName])
  )

  return soSalesOrderHeaders
    .filter((h) => !['C', 'X'].includes(h.OrderStatus) && h.OrderDate <= asOfDate)
    .map((h) => {
      const details = soSalesOrderDetails.filter((d) => d.SalesOrderNo === h.SalesOrderNo)
      const orderValue = details.reduce((s, d) => s + d.QuantityOrdered * d.UnitPrice, 0)
      const backorderValue = details.reduce((s, d) => s + d.QuantityBackordered * d.UnitPrice, 0)
      const key = `${h.ARDivisionNo}-${h.CustomerNo}`
      return {
        CustomerName: customerMap[key] ?? h.BillToName,
        SalesOrderNo: h.SalesOrderNo,
        OrderDate: h.OrderDate,
        ShipDate: h.ShipDate,
        OrderStatus: h.OrderStatus,
        OrderValue: Math.round(orderValue * 100) / 100,
        BackorderValue: Math.round(backorderValue * 100) / 100,
      }
    })
    .sort((a, b) => b.OrderValue - a.OrderValue)
}
