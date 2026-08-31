import { create } from "zustand";

/**
 * useThemeStore
 *
 * Manages the application colour theme: "light" | "dark" | "system".
 *
 * Architecture
 * ────────────
 * The no-flash guarantee lives in index.html (inline script runs before
 * any CSS/JS).  This store is the runtime source of truth that lets React
 * components read and change the theme.
 *
 * When setTheme() is called:
 *   1. Derives whether the resolved theme is dark (accounting for "system").
 *   2. Adds or removes the "dark" class on <html>.
 *   3. Persists the preference to localStorage under "iq-theme".
 *   4. Updates Zustand state so components re-render immediately.
 *
 * Reactive system preference
 * ──────────────────────────
 * A MediaQueryList listener is registered once on store creation.
 * When the OS switches between light/dark, the "system" option follows
 * automatically without any user interaction.
 */

const STORAGE_KEY = "iq-theme";

/** Return true if the resolved theme should be dark. */
const resolveIsDark = (theme) => {
  if (theme === "dark") return true;
  if (theme === "light") return false;
  // "system"
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

/** Apply or remove the "dark" class on <html> without transition flash. */
const applyClass = (isDark) => {
  if (isDark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
};

// Read the stored preference once at module load (same logic as index.html)
const storedTheme = localStorage.getItem(STORAGE_KEY) ?? "system";
const initialIsDark = resolveIsDark(storedTheme);

const useThemeStore = create((set, get) => {
  // Register a system-preference listener once at store creation.
  // Only has an effect when the current theme is "system".
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystemChange = () => {
    if (get().theme === "system") {
      const isDark = resolveIsDark("system");
      applyClass(isDark);
      set({ isDark });
    }
  };
  mql.addEventListener("change", onSystemChange);

  return {
    /** "light" | "dark" | "system" */
    theme: storedTheme,
    /** Resolved boolean — true when the page is currently dark */
    isDark: initialIsDark,

    /**
     * setTheme(newTheme)
     * Accepts "light", "dark", or "system".
     */
    setTheme: (newTheme) => {
      const isDark = resolveIsDark(newTheme);
      applyClass(isDark);
      localStorage.setItem(STORAGE_KEY, newTheme);
      set({ theme: newTheme, isDark });
    },

    /**
     * toggle()
     * Cycles: light → dark → system → light …
     * Useful for a single-button toggle.
     */
    toggle: () => {
      const { theme, setTheme } = get();
      const next =
        theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
      setTheme(next);
    },
  };
});

export default useThemeStore;
