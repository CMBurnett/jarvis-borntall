import { siteConfig } from "@/lib/site";

interface TopBarProps {
  instanceName?: string;
  logoUrl?: string | null;
}

export function TopBar({ instanceName = siteConfig.appName, logoUrl }: TopBarProps) {
  return (
    <header className="fixed left-22 right-0 top-0 z-30 flex h-16 items-center border-b border-border bg-card px-6">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={instanceName} className="h-6 w-auto object-contain" />
      ) : (
        <span className="font-semibold text-sm text-foreground tracking-tight">
          {instanceName}
        </span>
      )}
    </header>
  );
}
