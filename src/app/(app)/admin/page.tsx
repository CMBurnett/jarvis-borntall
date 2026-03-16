import { ShieldAlert, Users, Blocks, Paintbrush, Activity } from "lucide-react";

const PANELS = [
  {
    icon: Blocks,
    label: "App Management",
    description: "Enable, disable, and configure registered agents for this instance.",
    badge: "3 active",
  },
  {
    icon: Users,
    label: "User Management",
    description: "Invite users, assign roles (admin / end user), and manage access.",
    badge: "12 users",
  },
  {
    icon: Paintbrush,
    label: "Theming",
    description: "Set the primary colour, logo URL, and instance display name.",
    badge: "Navy brand",
  },
  {
    icon: Activity,
    label: "System Health",
    description: "Supabase connection status, Ollama model availability, and error logs.",
    badge: "All green",
  },
];

export default function AdminPage() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 pt-1">
        <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
          <ShieldAlert className="h-4 w-4 text-foreground" strokeWidth={1.75} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground leading-tight">Admin</h1>
          <p className="text-xs text-muted-foreground">Instance configuration · admin only</p>
        </div>
      </div>

      {/* Warning banner */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20 px-4 py-3 flex items-start gap-2.5">
        <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Changes here affect all users on this Jarvis instance. Proceed carefully.
        </p>
      </div>

      {/* Admin panels */}
      <div className="flex flex-col gap-2">
        {PANELS.map(({ icon: Icon, label, description, badge }) => (
          <div
            key={label}
            className="rounded-xl border border-border bg-card px-5 py-4 shadow-sm flex items-center gap-4 cursor-pointer hover:bg-muted/30 transition-colors"
          >
            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            </div>
            <span className="text-xs font-medium text-muted-foreground shrink-0 bg-muted px-2 py-0.5 rounded-full">
              {badge}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center">Phase 3 — full admin panel coming soon</p>
    </div>
  );
}
