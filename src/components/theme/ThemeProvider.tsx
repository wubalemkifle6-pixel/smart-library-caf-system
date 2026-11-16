"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark";

const STORAGE_KEY = "sl-theme";

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "light",
  toggle: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

/**
 * Centralized theme system for every dashboard and public page.
 * - Persists explicit choice in localStorage.
 * - Falls back to the device's system preference when no choice was made.
 * - The pre-hydration script in the root layout applies the class before
 *   first paint, so there is no flash of the wrong theme.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {}
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const initial: Theme =
      stored === "light" || stored === "dark"
        ? stored
        : media.matches
          ? "dark"
          : "light";
    setTheme(initial);
    applyTheme(initial);

    const onChange = (e: MediaQueryListEvent) => {
      let hasChoice = false;
      try {
        hasChoice = !!localStorage.getItem(STORAGE_KEY);
      } catch {}
      if (!hasChoice) {
        const next: Theme = e.matches ? "dark" : "light";
        setTheme(next);
        applyTheme(next);
      }
    };
    media.addEventListener?.("change", onChange);
    return () => media.removeEventListener?.("change", onChange);
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {}
      applyTheme(next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Accessible sun/moon toggle with a smooth CSS crossfade/rotation.
 * Used in every dashboard header and the public navbar.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className={cn(
        "theme-toggle relative z-[45] w-10 h-10 min-w-[40px] min-h-[40px] rounded-lg",
        "flex items-center justify-center text-slate-600 hover:bg-slate-100 active:bg-slate-200",
        className
      )}
    >
      <Sun size={19} className="theme-icon theme-icon-sun absolute" />
      <Moon size={19} className="theme-icon theme-icon-moon absolute" />
    </button>
  );
}
