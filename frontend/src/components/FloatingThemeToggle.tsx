'use client';

import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon } from "lucide-react";

export default function FloatingThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-6 right-6 z-[999] w-12 h-12 rounded-full flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl cursor-pointer hover:scale-110 active:scale-95 transition-all text-slate-700 dark:text-slate-300"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-amber-500 animate-pulse" />
      ) : (
        <Moon className="w-5 h-5 text-slate-500" />
      )}
    </button>
  );
}
