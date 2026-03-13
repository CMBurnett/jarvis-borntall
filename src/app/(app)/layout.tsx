import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, DEV_USER } from "@/lib/supabase/dev";
import { NavSidebar } from "@/components/layout/nav-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import type { User } from "@supabase/supabase-js";

type ProfileData = { role: string } | null;
type ConfigData = { instance_name: string; logo_url: string | null; primary_color: string } | null;

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user: User;
  let isAdmin = true; // admin by default in dev
  let instanceName = "Jarvis";
  let logoUrl: string | null = null;

  if (!isSupabaseConfigured()) {
    // Dev bypass — no Supabase credentials configured yet
    user = DEV_USER;
  } else {
    const supabase = await createClient();

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) redirect("/login");
    user = authUser;

    const [profileResult, configResult] = await Promise.all([
      supabase.from("profiles").select("role").eq("id", user.id).single(),
      supabase.from("instance_config").select("instance_name, logo_url, primary_color").single(),
    ]);

    const profile = profileResult.data as ProfileData;
    const config = configResult.data as ConfigData;

    isAdmin = profile?.role === "admin";
    instanceName = config?.instance_name ?? "Jarvis";
    logoUrl = config?.logo_url ?? null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <NavSidebar isAdmin={isAdmin} />

      <div className="flex flex-1 flex-col pl-16">
        <TopBar user={user} instanceName={instanceName} logoUrl={logoUrl} />

        <main className="flex-1 pt-16">
          <div className="h-full p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
