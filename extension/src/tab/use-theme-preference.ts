import { useEffect, useState } from "react";
import { ChromeLocalStore, type KeyValueStore } from "../lib/scryfall/cache";

export type Theme = "light" | "dark";

const STORAGE_KEY = "c500ThemePreference";

const defaultThemeStore = new ChromeLocalStore();

function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

function prefersLight(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-color-scheme: light)").matches;
}

/**
 * Resolves and persists the full-tab view's light/dark theme, per
 * panel-theming's spec: a stored manual choice wins outright; absent one,
 * the panel follows a live OS prefers-color-scheme reading until the user
 * manually picks a theme, after which the OS is no longer consulted.
 * `document.documentElement`'s `data-theme` attribute is the only thing
 * panel.css actually reads (see design.md's token-layering decision).
 */
export function useThemePreference(
  store: KeyValueStore = defaultThemeStore,
): { theme: Theme; setTheme: (theme: Theme) => void } {
  const [theme, setThemeState] = useState<Theme>(() => (prefersLight() ? "light" : "dark"));
  const [hasManualChoice, setHasManualChoice] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Stored preference, if any, wins outright over whatever the initial
  // OS-preference guess above landed on.
  useEffect(() => {
    let cancelled = false;
    store.get(STORAGE_KEY).then((stored) => {
      if (cancelled || !isTheme(stored)) return;
      setThemeState(stored);
      setHasManualChoice(true);
    });
    return () => {
      cancelled = true;
    };
  }, [store]);

  // Tracks a live OS theme change only until a manual choice exists (either
  // a stored one loaded above, or one made via setTheme below) — the effect
  // tears down its listener the moment hasManualChoice flips true and never
  // re-subscribes, so a later OS change can't override a manual pick.
  useEffect(() => {
    if (hasManualChoice) return;
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(prefers-color-scheme: light)");
    function onChange(event: MediaQueryListEvent) {
      setThemeState(event.matches ? "light" : "dark");
    }
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [hasManualChoice]);

  function setTheme(next: Theme): void {
    setThemeState(next);
    setHasManualChoice(true);
    void store.set(STORAGE_KEY, next);
  }

  return { theme, setTheme };
}
