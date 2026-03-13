import { isSupabaseConfigured, DEV_USER } from "@/lib/supabase/dev";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  let name = "there";

  if (!isSupabaseConfigured()) {
    name = DEV_USER.user_metadata?.full_name ?? "Dev";
  } else {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    name = user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "there";
  }

  const greeting = getGreeting();

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {greeting}, {name}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {formatDate(new Date())}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            Home dashboard — coming in Phase 3
          </p>
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
