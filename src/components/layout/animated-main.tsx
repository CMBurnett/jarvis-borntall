"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { getNavOrder, getIntermediateOrders, getNavEntryByOrder } from "@/lib/nav-config";

// ─── Timing constants ─────────────────────────────────────
const EXIT_DURATION   = 0.2; // seconds
const ENTER_DURATION  = 0.28;
const INT_PER_VIEW    = 0.22; // seconds per intermediate ghost

const EASE_OUT = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];
const EASE_IN  = [0.55, 0.055, 0.675, 0.19] as [number, number, number, number];

// ─── Page variants (direction-aware + enter delay) ────────
const pageVariants = {
  enter: ({ dir, delay }: { dir: 1 | -1; delay: number }) => ({
    y: dir > 0 ? 14 : -14,
    opacity: 0,
    transition: { delay, duration: ENTER_DURATION, ease: EASE_OUT },
  }),
  visible: ({ delay }: { dir: 1 | -1; delay: number }) => ({
    y: 0,
    opacity: 1,
    transition: { delay, duration: ENTER_DURATION, ease: EASE_OUT },
  }),
  exit: ({ dir }: { dir: 1 | -1; delay: number }) => ({
    y: dir > 0 ? -8 : 8,
    opacity: 0,
    transition: { duration: EXIT_DURATION, ease: EASE_IN },
  }),
};

// ─── Ghost card shown for each skipped view ───────────────
function IntermediateGhost({ order }: { order: number }) {
  const entry = getNavEntryByOrder(order);
  if (!entry) return null;
  const Icon = entry.icon;

  return (
    <div className="absolute inset-0 flex flex-col gap-6 p-6 bg-background/96 backdrop-blur-sm">
      {/* Section header */}
      <div className="flex items-center gap-3 pt-1">
        <div className="h-9 w-9 rounded-xl bg-brand-gradient flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-primary-foreground" strokeWidth={1.75} />
        </div>
        <div className="h-4 w-28 rounded-full bg-muted" />
      </div>

      {/* Skeleton body — suggests content without being distracting */}
      <div className="flex flex-col gap-3 flex-1">
        <div className="h-28 rounded-2xl bg-muted/70" />
        <div className="grid grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-muted/50" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3 mt-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-36 rounded-xl bg-muted/40" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Sequences through each intermediate view ─────────────
function IntermediateFlash({
  orders,
  direction,
  onComplete,
}: {
  orders: number[];
  direction: 1 | -1;
  onComplete: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  // Auto-hide after a short display window
  useEffect(() => {
    setVisible(true);
    const t = setTimeout(() => setVisible(false), INT_PER_VIEW * 1000 * 0.55);
    return () => clearTimeout(t);
  }, [index]);

  function handleExitComplete() {
    const next = index + 1;
    if (next < orders.length) {
      setIndex(next);
    } else {
      onComplete();
    }
  }

  return (
    <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-2xl">
      <AnimatePresence onExitComplete={handleExitComplete}>
        {visible && (
          <motion.div
            key={index}
            className="absolute inset-0"
            initial={{ y: direction > 0 ? "100%" : "-100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: direction > 0 ? "-36%" : "36%", opacity: 0 }}
            transition={{ duration: INT_PER_VIEW * 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <IntermediateGhost order={orders[index]} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────
export function AnimatedMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Track direction synchronously during render (before AnimatePresence uses custom)
  const prevPathRef     = useRef(pathname);
  const dirRef          = useRef<1 | -1>(1);
  const enterDelayRef   = useRef(0);
  const intermediatesRef = useRef<number[]>([]);

  const prev = prevPathRef.current;
  if (prev !== pathname) {
    const prevOrder   = getNavOrder(prev);
    const newOrder    = getNavOrder(pathname);
    dirRef.current    = newOrder >= prevOrder ? 1 : -1;
    const ints        = getIntermediateOrders(prevOrder, newOrder);
    intermediatesRef.current = ints;
    enterDelayRef.current    = ints.length > 0
      ? EXIT_DURATION * 0.6 + ints.length * INT_PER_VIEW
      : 0;
    prevPathRef.current = pathname;
  }

  // Trigger intermediate overlay
  const [intermediates, setIntermediates] = useState<number[]>([]);
  const [prevPath, setPrevPath] = useState(pathname);

  useEffect(() => {
    if (pathname === prevPath) return;
    const ints = intermediatesRef.current;
    if (ints.length > 0) {
      // Start overlay just after exit animation begins
      const t = setTimeout(() => setIntermediates([...ints]), EXIT_DURATION * 300 * 0.4);
      return () => clearTimeout(t);
    }
    setPrevPath(pathname);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const custom = { dir: dirRef.current, delay: enterDelayRef.current };

  return (
    <main className="flex-1 relative overflow-hidden">
      {/* Brand glow */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-175 h-48"
        style={{ background: "radial-gradient(ellipse at 50% 0%, var(--brand-glow) 0%, transparent 70%)" }}
      />

      {/* Animated page content */}
      <div className="relative h-full overflow-hidden">
        <AnimatePresence mode="sync" initial={false}>
          <motion.div
            key={pathname}
            custom={custom}
            initial="enter"
            animate="visible"
            exit="exit"
            variants={pageVariants}
            className="absolute inset-0 overflow-y-auto"
          >
            <div className="p-6">{children}</div>
          </motion.div>
        </AnimatePresence>

        {/* Intermediate ghost overlay */}
        <AnimatePresence>
          {intermediates.length > 0 && (
            <IntermediateFlash
              orders={intermediates}
              direction={dirRef.current}
              onComplete={() => {
                setIntermediates([]);
                setPrevPath(pathname);
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
