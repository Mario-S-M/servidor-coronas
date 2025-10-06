"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { Button } from "./button";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className="h-9 w-9 p-0 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900"
      aria-label="Cambiar tema"
    >
      {theme === "light" ? (
        <Moon className="h-4 w-4 text-black dark:text-white" />
      ) : (
        <Sun className="h-4 w-4 text-black dark:text-white" />
      )}
    </Button>
  );
}
