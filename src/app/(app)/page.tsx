import { isSupabaseConfigured, DEV_USER } from "@/lib/supabase/dev";
import { createClient } from "@/lib/supabase/server";
import { HomeContent } from "@/components/home/home-content";
import type { ISOSummary, OrderSummary, ReportingSummary } from "@/components/home/home-content";

export default async function HomePage() {
  let name = "there";
  let isoSummary: ISOSummary = null;
  let orderSummary: OrderSummary = { pendingReview: 0, approvedToday: 0, recentOrders: [] };
  let reportingSummary: ReportingSummary = { savedDashboards: [] };

  const supabase = isSupabaseConfigured() ? await createClient() : null;

  if (!isSupabaseConfigured()) {
    const fullName = DEV_USER.user_metadata?.full_name as string | undefined;
    name = fullName?.split(" ")[0] ?? "Dev";
  } else if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    const fullName = user?.user_metadata?.full_name as string | undefined;
    name = fullName?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there";
  }

  if (supabase) {
    // ── ISO Ready ─────────────────────────────────────────────────────────────
    try {
      const { data: assessments } = await supabase
        .from("assessments")
        .select("id, client_name, status, standards, created_at")
        .order("created_at", { ascending: false })
        .limit(1);

      const last = assessments?.[0] ?? null;
      if (last) {
        const { data: clauses } = await supabase
          .from("clause_assessments")
          .select("status")
          .eq("assessment_id", last.id);

        let gaps = 0, partial = 0, evidenced = 0;
        for (const c of clauses ?? []) {
          if (c.status === "gap") gaps++;
          else if (c.status === "partial") partial++;
          else if (c.status === "evidenced") evidenced++;
        }
        isoSummary = { ...last, gaps, partial, evidenced };
      }
    } catch { /* table may not exist in dev */ }

    // ── Order Processing ──────────────────────────────────────────────────────
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [{ data: recentOrders }, { count: pendingCount }, { count: approvedCount }] =
        await Promise.all([
          supabase
            .from("op_orders")
            .select("id, customer_name, po_number, status, received_at")
            .order("received_at", { ascending: false })
            .limit(3),
          supabase
            .from("op_orders")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending_review"),
          supabase
            .from("op_orders")
            .select("*", { count: "exact", head: true })
            .eq("status", "approved")
            .gte("reviewed_at", todayStart.toISOString()),
        ]);

      orderSummary = {
        pendingReview: pendingCount ?? 0,
        approvedToday: approvedCount ?? 0,
        recentOrders: (recentOrders ?? []).map((o) => ({
          id: o.id as string,
          customer_name: (o.customer_name as string | null) ?? null,
          po_number: (o.po_number as string | null) ?? null,
          status: o.status as string,
          received_at: o.received_at as string,
        })),
      };
    } catch { /* table may not exist in dev */ }

    // ── Reporting ─────────────────────────────────────────────────────────────
    try {
      const { data: dashboards } = await supabase
        .from("rp_dashboards")
        .select("id, name, source, preset_slug, created_at")
        .order("created_at", { ascending: false })
        .limit(8);

      reportingSummary = { savedDashboards: dashboards ?? [] };
    } catch { /* table may not exist in dev */ }
  }

  return (
    <HomeContent
      name={name}
      isoSummary={isoSummary}
      orderSummary={orderSummary}
      reportingSummary={reportingSummary}
    />
  );
}
