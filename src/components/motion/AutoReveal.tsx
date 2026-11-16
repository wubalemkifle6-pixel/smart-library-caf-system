"use client";
import { useEffect, useLayoutEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Elements that receive scroll-reveal animations across every dashboard and
 * public page. Cards already using .card-hover, chart containers, and data
 * tables are covered automatically; any element can opt in with data-reveal.
 */
const SELECTOR =
  "[data-reveal], .card-hover, .recharts-responsive-container, .data-table-card";

/**
 * Lightweight page transition: the keyed wrapper remounts on navigation and
 * plays a short fade/slide entrance. Entrance-only by design so navigation
 * stays instant (no artificial delays, no exit blocking).
 */
export function PageTransition({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  return (
    <div key={pathname} className={cn("animate-page-in", className)}>
      {children}
    </div>
  );
}

/**
 * Shared scroll-reveal engine.
 * - One IntersectionObserver per page (no per-element listeners).
 * - A MutationObserver (rAF-debounced) picks up async content such as
 *   tables and charts that mount after data loads.
 * - Elements animate in when entering the viewport and reset when fully
 *   leaving it, so the animation replays on every scroll pass (down & up).
 * - Above-the-fold elements are marked visible before first paint to avoid
 *   flicker; the page transition covers their entrance instead.
 * - Honors prefers-reduced-motion (content stays fully visible) and
 *   disconnects everything on route change/unmount.
 */
export function AutoReveal() {
  const pathname = usePathname();

  useIsoLayoutEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const root = document.querySelector("main") || document.body;
    let observer: IntersectionObserver | null = null;
    let mutation: MutationObserver | null = null;
    let raf = 0;
    const armed = new WeakSet<Element>();

    const inView = (el: Element) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.top < window.innerHeight * 0.96 && r.bottom > 0;
    };

    const arm = (el: Element) => {
      if (armed.has(el) || media.matches || !observer) return;
      armed.add(el);
      // Subtle stagger for cards inside grids (capped so long lists stay snappy)
      let delay = 0;
      const parent = el.parentElement;
      if (parent && getComputedStyle(parent).display.includes("grid")) {
        const idx = Array.prototype.indexOf.call(parent.children, el);
        delay = Math.min(Math.max(idx, 0), 8) * 45;
      }
      el.setAttribute("data-reveal-delay", String(delay));
      (el as HTMLElement).style.setProperty("--reveal-delay", `${delay}ms`);
      el.classList.add("reveal");
      if (inView(el)) el.classList.add("is-in");
      observer.observe(el);
    };

    const scan = () => {
      root.querySelectorAll(SELECTOR).forEach(arm);
    };

    const start = () => {
      observer = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            const el = e.target as HTMLElement;
            if (e.isIntersecting) {
              el.style.setProperty(
                "--reveal-delay",
                `${el.getAttribute("data-reveal-delay") || "0"}ms`
              );
              el.classList.add("is-in");
            } else if (e.intersectionRatio <= 0) {
              // Fully out of view: reset so the entrance replays next time.
              el.style.setProperty("--reveal-delay", "0ms");
              el.classList.remove("is-in");
            }
          }
        },
        { threshold: [0, 0.05], rootMargin: "0px 0px -6% 0px" }
      );
      scan();
      mutation = new MutationObserver(() => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(scan);
      });
      mutation.observe(root, { childList: true, subtree: true });
    };

    const teardown = () => {
      cancelAnimationFrame(raf);
      observer?.disconnect();
      mutation?.disconnect();
      observer = null;
      mutation = null;
      root.querySelectorAll(".reveal").forEach((el) => {
        el.classList.remove("reveal", "is-in");
        (el as HTMLElement).style.removeProperty("--reveal-delay");
      });
    };

    if (!media.matches) start();
    const onMediaChange = () => {
      teardown();
      if (!media.matches) start();
    };
    media.addEventListener?.("change", onMediaChange);

    return () => {
      media.removeEventListener?.("change", onMediaChange);
      teardown();
    };
  }, [pathname]);

  return null;
}
