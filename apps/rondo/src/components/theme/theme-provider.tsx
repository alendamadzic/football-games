"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ThemePreference = "system" | "light" | "dark";

type ThemeContextValue = {
  /** The user's stored preference. */
  theme: ThemePreference;
  /** The actually-applied scheme after resolving "system". */
  resolved: "light" | "dark";
  setTheme: (theme: ThemePreference) => void;
  /** Cycles System → Light → Dark → System. */
  cycleTheme: () => void;
};

const STORAGE_KEY = "rondo-theme";
const ORDER: ThemePreference[] = ["system", "light", "dark"];

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemPrefersDark() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function applyTheme(theme: ThemePreference): "light" | "dark" {
  const dark = theme === "dark" || (theme === "system" && systemPrefersDark());
  document.documentElement.classList.toggle("dark", dark);
  return dark ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  // Hydrate from storage on mount (the inline ThemeScript already applied it).
  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) ??
      "system") as ThemePreference;
    setThemeState(stored);
    setResolved(applyTheme(stored));
  }, []);

  // Keep "system" preference in sync with OS changes.
  useEffect(() => {
    if (theme !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setResolved(applyTheme("system"));
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((next: ThemePreference) => {
    setThemeState(next);
    localStorage.setItem(STORAGE_KEY, next);
    setResolved(applyTheme(next));
  }, []);

  const cycleTheme = useCallback(() => {
    setThemeState((current) => {
      const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
      localStorage.setItem(STORAGE_KEY, next);
      setResolved(applyTheme(next));
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ theme, resolved, setTheme, cycleTheme }),
    [theme, resolved, setTheme, cycleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
