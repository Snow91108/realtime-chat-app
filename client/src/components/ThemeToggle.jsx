import { useEffect, useState } from "react";
import { SunIcon, MoonIcon } from "./Icons";

const ThemeToggle = () => {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("budping-theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("budping-theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("budping-theme", "light");
    }
  }, [dark]);

  return (
    <button
      id="theme-toggle"
      onClick={() => setDark((d) => !d)}
      aria-label="Toggle theme"
      className="relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500
                 bg-gray-200 dark:bg-brand-600 flex items-center"
    >
      <span
        className={`absolute left-0.5 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 shadow-md
                    bg-white dark:bg-surface-900 ${dark ? "translate-x-6" : "translate-x-0"}`}
      >
        {dark ? (
          <MoonIcon className="w-3 h-3 text-brand-400" />
        ) : (
          <SunIcon className="w-3 h-3 text-amber-500" />
        )}
      </span>
    </button>
  );
};

export default ThemeToggle;
