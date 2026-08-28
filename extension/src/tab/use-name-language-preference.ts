import { useEffect, useState } from "react";
import { ChromeLocalStore, type KeyValueStore } from "../lib/scryfall/cache";
import type { NameLanguage } from "../lib/deck/display-name";

const STORAGE_KEY = "c500NameLanguagePreference";

const defaultNameLanguageStore = new ChromeLocalStore();

function isNameLanguage(value: unknown): value is NameLanguage {
  return value === "en" || value === "pt";
}

/**
 * Resolves and persists the full-tab view's card-name display language, per
 * card-name-language's spec: defaults to English (unlike panel-theming,
 * there is no OS signal for a "preferred card-name language"), and a stored
 * manual choice takes precedence on every later open until the user toggles
 * again.
 */
export function useNameLanguagePreference(
  store: KeyValueStore = defaultNameLanguageStore,
): { language: NameLanguage; setLanguage: (language: NameLanguage) => void } {
  const [language, setLanguageState] = useState<NameLanguage>("en");

  useEffect(() => {
    let cancelled = false;
    store.get(STORAGE_KEY).then((stored) => {
      if (cancelled || !isNameLanguage(stored)) return;
      setLanguageState(stored);
    });
    return () => {
      cancelled = true;
    };
  }, [store]);

  function setLanguage(next: NameLanguage): void {
    setLanguageState(next);
    void store.set(STORAGE_KEY, next);
  }

  return { language, setLanguage };
}
