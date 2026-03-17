import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, DEV_USER } from "@/lib/supabase/dev";
import { NavSidebar } from "@/components/layout/nav-sidebar";
import { AnimatedMain } from "@/components/layout/animated-main";
import type { User } from "@supabase/supabase-js";

type ProfileData = { role: string } | null;

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user: User;
  let isAdmin = true; // admin by default in dev

  if (!isSupabaseConfigured()) {
    // Dev bypass — no Supabase credentials configured yet
    user = DEV_USER;
  } else {
    const supabase = await createClient();

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) redirect("/login");
    user = authUser;

    const [profileResult] = await Promise.all([
      supabase.from("profiles").select("role").eq("id", user.id).single(),
    ]);

    const profile = profileResult.data as ProfileData;

    isAdmin = profile?.role === "admin";
  }

  return (
    <div className="flex min-h-screen bg-background bg-dot-pattern">
      <NavSidebar isAdmin={isAdmin} user={user} />

      <div className="flex flex-1 flex-col pl-22">
        <AnimatedMain>{children}</AnimatedMain>
      </div>
    </div>
  );
}
