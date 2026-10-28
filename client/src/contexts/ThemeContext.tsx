import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";
interface ThemeContextType {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme(next: ThemePreference, origin?: HTMLElement | null): void;
  toggleTheme(): void;
  switchable: boolean;
}

const STORAGE_KEY = "aicte-theme-preference";
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
type ViewTransitionDocument = Document & { startViewTransition?: (callback: () => void) => { finished: Promise<unknown> } };

function readInitialTheme(fallback: ThemePreference): ThemePreference {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light" || stored === "system") return stored;
  } catch { /* Keep the app usable when storage is restricted. */ }
  return fallback;
}

function readSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined" || !window.matchMedia) return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(preference: ThemePreference, system: ResolvedTheme): ResolvedTheme {
  return preference === "system" ? system : preference;
}

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  switchable = false,
}: {
  children: React.ReactNode;
  defaultTheme?: ThemePreference;
  switchable?: boolean;
}) {
  const [theme, setThemeState] = useState<ThemePreference>(() => readInitialTheme(defaultTheme));
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(readSystemTheme);
  const transitionBusy = useRef(false);
  const resolvedTheme = resolveTheme(theme, systemTheme);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const update = (event: MediaQueryListEvent | MediaQueryList) => setSystemTheme(event.matches ? "dark" : "light");
    query.addEventListener?.("change", update);
    if (!query.addEventListener) query.addListener(update);
    return () => {
      query.removeEventListener?.("change", update);
      if (!query.removeEventListener) query.removeListener(update);
    };
  }, []);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", resolvedTheme === "dark");
    root.dataset.theme = resolvedTheme;
    root.style.colorScheme = resolvedTheme;
    if (switchable) {
      try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* Preference is optional when storage is restricted. */ }
    }
    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (themeColor) themeColor.content = resolvedTheme === "dark" ? "#0B0B0C" : "#F6F5F2";
  }, [resolvedTheme, switchable, theme]);

  const setTheme = useCallback((next: ThemePreference, origin?: HTMLElement | null) => {
    if (!switchable || next === theme || transitionBusy.current) return;
    const nextResolved = resolveTheme(next, systemTheme);
    const root = document.documentElement;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const transitionDocument = document as ViewTransitionDocument;
    const startTransition = transitionDocument.startViewTransition;

    if (reduced || !startTransition || nextResolved === resolvedTheme) {
      setThemeState(next);
      return;
    }

    const bounds = origin?.getBoundingClientRect();
    const x = bounds ? bounds.left + bounds.width / 2 : window.innerWidth / 2;
    const y = bounds ? bounds.top + bounds.height / 2 : 32;
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    root.style.setProperty("--theme-reveal-x", `${x}px`);
    root.style.setProperty("--theme-reveal-y", `${y}px`);
    root.style.setProperty("--theme-reveal-radius", `${radius}px`);

    try {
      transitionBusy.current = true;
      const transition = startTransition.call(transitionDocument, () => flushSync(() => setThemeState(next)));
      void transition.finished.catch(() => undefined).finally(() => {
        root.style.removeProperty("--theme-reveal-x");
        root.style.removeProperty("--theme-reveal-y");
        root.style.removeProperty("--theme-reveal-radius");
        transitionBusy.current = false;
      });
    } catch {
      transitionBusy.current = false;
      setThemeState(next);
    }
  }, [resolvedTheme, switchable, systemTheme, theme]);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  const value = useMemo(() => ({ theme, resolvedTheme, setTheme, toggleTheme, switchable }), [theme, resolvedTheme, setTheme, toggleTheme, switchable]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
