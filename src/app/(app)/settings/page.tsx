import { Settings, Cpu, Palette, User, Bell } from "lucide-react";

const SECTIONS = [
  {
    icon: Cpu,
    label: "AI Model",
    description: "Select the LLM provider and model used by Jarvis.",
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

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 pt-1">
        <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
          <Settings className="h-4 w-4 text-foreground" strokeWidth={1.75} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground leading-tight">Settings</h1>
          <p className="text-xs text-muted-foreground">Model config, appearance, and preferences</p>
        </div>
      </div>

      {/* Setting groups */}
      <div className="flex flex-col gap-2">
        {SECTIONS.map(({ icon: Icon, label, description, preview }) => (
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
            <span className="text-xs text-muted-foreground shrink-0">{preview}</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center">Phase 3 — full settings coming soon</p>
    </div>
  );
}
