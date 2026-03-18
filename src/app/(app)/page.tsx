import { isSupabaseConfigured, DEV_USER } from "@/lib/supabase/dev";
import { createClient } from "@/lib/supabase/server";
import { HomeContent } from "@/components/home/home-content";

export default async function HomePage() {
  let name = "there";

  if (!isSupabaseConfigured()) {
    const fullName = DEV_USER.user_metadata?.full_name as string | undefined;
    name = fullName?.split(" ")[0] ?? "Dev";
  } else {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const fullName = user?.user_metadata?.full_name as string | undefined;
    name =
      fullName?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there";
  }

  return <HomeContent name={name} />;
}
