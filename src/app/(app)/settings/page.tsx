import {
  Settings,
  Cpu,
  Palette,
  User,
  Bell,
  Blocks,
  Users,
  Paintbrush,
  Activity,
} from "lucide-react";
import { siteConfig } from "@/lib/site";

const SETTINGS_SECTIONS = [
  {
    icon: Cpu,
    label: "AI Model",
    description: `Select the LLM provider and model used by ${siteConfig.appName}.`,
    preview: "Ollama · Qwen3.5 · local",
  },
  {
    icon: Palette,
    label: "Appearance",
    description: "Theme, accent colour, and display density.",
    preview: "Light · Navy brand",
  },
  {
    icon: User,
    label: "Profile",
    description: "Your name, email, and notification preferences.",
    preview: "dev@jarvis.local",
  },
  {
    icon: Bell,
    label: "Notifications",
    description: "Alerts for compliance deadlines, order exceptions, and more.",
    preview: "Email · In-app enabled",
  },
];

const ADMIN_SECTIONS = [
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

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 pt-1">
        <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
          <Settings className="h-4 w-4 text-foreground" strokeWidth={1.75} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground leading-tight">Settings</h1>
          <p className="text-xs text-muted-foreground">Preferences, model config, and administration</p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-2 gap-6">
        {/* General settings */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">General</p>
          <div className="flex flex-col gap-2">
            {SETTINGS_SECTIONS.map(({ icon: Icon, label, description, preview }) => (
              <div
                key={label}
                className="rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm flex items-center gap-3 cursor-pointer hover:bg-muted/30 transition-colors"
              >
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                </div>
                <span className="text-[11px] text-muted-foreground shrink-0">{preview}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Admin section */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Administration</p>
          <div className="flex flex-col gap-2">
            {ADMIN_SECTIONS.map(({ icon: Icon, label, description, badge }) => (
              <div
                key={label}
                className="rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm flex items-center gap-3 cursor-pointer hover:bg-muted/30 transition-colors"
              >
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                </div>
                <span className="text-[11px] font-medium text-muted-foreground shrink-0 bg-muted px-2 py-0.5 rounded-full">
                  {badge}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
