"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { siteConfig } from "@/lib/site";

export function BrandLogos() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";
  const appLogo = isDark ? siteConfig.appLogo.dark : siteConfig.appLogo.light;
  let companyLogoSrc: string | null = null;
  if (siteConfig.companyLogo) {
    companyLogoSrc = isDark ? siteConfig.companyLogo.dark : siteConfig.companyLogo.light;
  }

  return (
    <div className="flex items-center gap-3 shrink-0">
      {companyLogoSrc && (
        <Image
          src={companyLogoSrc}
          alt={`${siteConfig.companyName} logo`}
          width={120}
          height={32}
          className="h-6 w-auto"
          priority
        />
      )}
      <Image
        src={appLogo}
        alt={`${siteConfig.appName} logo`}
        width={80}
        height={24}
        className="h-5 w-auto opacity-50"
        priority
      />
    </div>
  );
}
