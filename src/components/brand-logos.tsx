"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";

export function BrandLogos() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const pelsealLogo =
    resolvedTheme === "dark" ? "/pelseal-home-white.svg" : "/pelseal-home-color.svg";
  const jarvisLogo =
    resolvedTheme === "dark" ? "/jarvis-white.svg" : "/jarvis-black.svg";

  return (
    <div className="flex items-center gap-3 shrink-0">
      <Image
        src={pelsealLogo}
        alt="Pelseal logo"
        width={120}
        height={32}
        className="h-8 w-auto"
        priority
      />
      <Image
        src={jarvisLogo}
        alt="Jarvis logo"
        width={80}
        height={24}
        className="h-5 w-auto opacity-50"
        priority
      />
    </div>
  );
}
