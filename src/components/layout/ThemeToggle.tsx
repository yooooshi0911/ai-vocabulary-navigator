"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Laptop } from "lucide-react";

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-8 h-8 rounded-lg bg-accent/40 animate-pulse" />
    );
  }

  const cycleTheme = () => {
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('system');
    else setTheme('dark');
  };

  return (
    <button
      onClick={cycleTheme}
      className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
      title={`現在のテーマ: ${theme || 'system'} (クリックで切替)`}
      aria-label="テーマ切替"
    >
      {theme === "dark" ? (
        <Moon size={18} className="text-indigo-400" />
      ) : theme === "light" ? (
        <Sun size={18} className="text-amber-500" />
      ) : (
        <Laptop size={18} className="text-muted-foreground" />
      )}
    </button>
  );
}
