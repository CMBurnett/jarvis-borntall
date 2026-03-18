import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  AlertTriangle,
  Clock,
} from "lucide-react";

const KPIS = [
  { label: "Revenue MTD", value: "$284,500", delta: "+12.3%", up: true, icon: DollarSign },
  { label: "Orders Shipped", value: "1,042", delta: "+8.1%", up: true, icon: Package },
  { label: "Active Customers", value: "47", delta: "+3", up: true, icon: Users },
  { label: "Past Due AR", value: "$41,200", delta: "+21%", up: false, icon: AlertTriangle },
];

const REVENUE_DATA = [
  { month: "Apr", value: 62 },
  { month: "May", value: 55 },
  { month: "Jun", value: 71 },
  { month: "Jul", value: 68 },
  { month: "Aug", value: 80 },
  { month: "Sep", value: 74 },
  { month: "Oct", value: 82 },
  { month: "Nov", value: 78 },
  { month: "Dec", value: 88 },
  { month: "Jan", value: 84 },
  { month: "Feb", value: 92 },
  { month: "Mar", value: 100 },
];

const TOP_CUSTOMERS = [
  { name: "Summit Supply Chain", revenue: "$412,300", pct: 24.4 },
  { name: "Apex Industrial Solutions", revenue: "$389,750", pct: 23.1 },
  { name: "Meridian Manufacturing", revenue: "$234,500", pct: 13.9 },
  { name: "Northstar Engineering", revenue: "$198,700", pct: 11.8 },
  { name: "Pinnacle Precision Parts", revenue: "$145,200", pct: 8.6 },
];

const RECENT_ORDERS = [
  { id: "SO-2024-0892", customer: "Summit Supply Chain", total: "$18,750", status: "Shipped", date: "Mar 14" },
  { id: "SO-2024-0891", customer: "Apex Industrial", total: "$24,300", status: "Processing", date: "Mar 12" },
  { id: "SO-2024-0890", customer: "Northstar Engineering", total: "$12,600", status: "Shipped", date: "Mar 11" },
  { id: "SO-2024-0889", customer: "Meridian Manufacturing", total: "$8,450", status: "Shipped", date: "Mar 10" },
  { id: "SO-2024-0888", customer: "Prairie Wind Energy", total: "$15,200", status: "Pending", date: "Mar 09" },
];

const INVENTORY_ALERTS = [
  { sku: "WLD-WIRE-045", name: "Welding Wire .045\"", qty: 42, reorder: 50, status: "Low" },
  { sku: "CNC-INSERT-T1", name: "CNC Carbide Insert T1", qty: 18, reorder: 25, status: "Low" },
  { sku: "HDW-SEAL-V2", name: "Hydraulic Seal V2", qty: 0, reorder: 30, status: "Out" },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
            <LayoutDashboard className="h-4 w-4 text-white" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground leading-tight">Dashboard</h1>
            <p className="text-xs text-muted-foreground">Sage 100 · Real-time business metrics</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          Last synced 4 min ago
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-3">
        {KPIS.map(({ label, value, delta, up, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <p className="text-2xl font-semibold text-foreground tabular-nums">{value}</p>
            <p className={`text-xs mt-1 flex items-center gap-0.5 ${up ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
              {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {delta} vs last month
            </p>
          </div>
        ))}
      </div>

      {/* Revenue Chart + Top Customers */}
      <div className="grid grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <div className="col-span-2 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-foreground">Revenue — Last 12 Months</p>
            <p className="text-xs text-muted-foreground">YTD: $1,687,450</p>
          </div>
          <div className="flex items-end gap-1.5 h-36">
            {REVENUE_DATA.map(({ month, value }) => (
              <div key={month} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-linear-to-t from-violet-500 to-purple-500 opacity-80 hover:opacity-100 transition-opacity"
                  style={{ height: `${value}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
            {REVENUE_DATA.map(({ month }) => (
              <span key={month} className="flex-1 text-center">{month}</span>
            ))}
          </div>
        </div>

        {/* Top Customers */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm font-semibold text-foreground mb-3">Top Customers</p>
          <div className="flex flex-col gap-3">
            {TOP_CUSTOMERS.map(({ name, revenue, pct }) => (
              <div key={name}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-foreground font-medium truncate mr-2">{name}</span>
                  <span className="text-muted-foreground tabular-nums shrink-0">{revenue}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-violet-500 to-purple-500"
                    style={{ width: `${pct * 4}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders + Inventory Alerts */}
      <div className="grid grid-cols-3 gap-4">
        {/* Recent Orders */}
        <div className="col-span-2 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-border/60">
            <p className="text-sm font-semibold text-foreground">Recent Orders</p>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/40 text-muted-foreground">
                <th className="text-left font-medium px-5 py-2">Order</th>
                <th className="text-left font-medium px-3 py-2">Customer</th>
                <th className="text-right font-medium px-3 py-2">Total</th>
                <th className="text-left font-medium px-3 py-2">Status</th>
                <th className="text-right font-medium px-5 py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_ORDERS.map(({ id, customer, total, status, date }) => (
                <tr key={id} className="border-b border-border/20 last:border-0">
                  <td className="px-5 py-2.5 font-mono text-foreground">{id}</td>
                  <td className="px-3 py-2.5 text-foreground">{customer}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-foreground">{total}</td>
                  <td className="px-3 py-2.5">
                    <OrderStatus status={status} />
                  </td>
                  <td className="px-5 py-2.5 text-right text-muted-foreground">{date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Inventory Alerts */}
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-border/60">
            <p className="text-sm font-semibold text-foreground">Inventory Alerts</p>
          </div>
          <div className="flex flex-col">
            {INVENTORY_ALERTS.map(({ sku, name, qty, reorder, status }) => (
              <div key={sku} className="px-5 py-3 border-b border-border/20 last:border-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-medium text-foreground">{name}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                    status === "Out"
                      ? "bg-red-500/10 text-red-600 dark:text-red-400"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  }`}>
                    {status === "Out" ? "Out of Stock" : "Low Stock"}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {sku} · {qty} on hand · reorder at {reorder}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderStatus({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Shipped: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    Processing: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    Pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  };
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${styles[status] ?? ""}`}>
      {status}
    </span>
  );
}
