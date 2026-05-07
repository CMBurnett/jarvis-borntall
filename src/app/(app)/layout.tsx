import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, DEV_USER } from "@/lib/supabase/dev";
import { ContextPicker, ContextNav } from "@/components/shell/ContextSelector";
import { UserMenu } from "@/components/shell/UserMenu";
import { MOCK_CONTEXTS } from "@/lib/data/mock-contexts";
import type { Context } from "@/lib/types/contexts";
import type { User } from "@supabase/supabase-js";

type ProfileData = { role: string } | null;

// Left panel: left-4 (1rem) + w-56 (14rem) + gap-3 (0.75rem) = canvas starts here
const CANVAS_LEFT = "calc(1rem + 14rem + 0.75rem)";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user: User;
  let isAdmin = true;
  let contexts: Context[] = MOCK_CONTEXTS;

  if (!isSupabaseConfigured()) {
    user = DEV_USER;
  } else {
    const supabase = await createClient();

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) redirect("/login");
    user = authUser;

    const [profileResult, contextsResult] = await Promise.all([
      supabase.from("profiles").select("role").eq("id", user.id).single(),
      supabase
        .from("contexts")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false }),
    ]);

    const profile = profileResult.data as ProfileData;
    isAdmin = profile?.role === "admin";

    if (contextsResult.data && contextsResult.data.length > 0) {
      contexts = contextsResult.data.map((c) => ({
        ...c,
        models: (c.models ?? []) as unknown as Context["models"],
        tools: (c.tools ?? []) as unknown as Context["tools"],
        security_tier: c.security_tier as 1 | 2 | 3,
      }));
    }
    // Falls back to MOCK_CONTEXTS if table empty or not yet created
  }

  return (
    <>
      {/* Left column */}
      <div className="fixed top-4 bottom-4 left-4 z-20 flex w-56 flex-col items-stretch gap-3">
        <ContextPicker contexts={contexts} />
        <ContextNav contexts={contexts} />
        <div className="flex-1" />
        <UserMenu user={user} />
      </div>

      {/* Canvas — scrolls both axes, fills the rest of the viewport */}
      <div
        className="fixed top-0 bottom-0 right-0 overflow-auto"
        style={{ left: CANVAS_LEFT }}
      >
        {children}
      </div>
    </>
  );
}
