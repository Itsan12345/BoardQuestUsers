"use client";

import * as React from "react";
import { Moon, Sun, Laptop, Check } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  align?: "start" | "center" | "end";
}

export function ThemeToggle({ className, align = "end" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-9 w-9 rounded-full border border-border/60 bg-muted/30 text-muted-foreground transition-colors",
          className
        )}
        aria-label="Toggle theme"
      >
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          id="tour-theme-toggle"
          className={cn(
            "relative h-9 w-9 rounded-full border border-border/80 bg-background/80 hover:bg-muted/80 text-foreground shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-primary hover:border-primary/40",
            className
          )}
          aria-label="Select theme"
          title="Toggle color theme (Light / Dark / System)"
        >
          <Sun className="h-[1.1rem] w-[1.1rem] rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0 text-amber-500" />
          <Moon className="absolute h-[1.1rem] w-[1.1rem] rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100 text-indigo-400" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        sideOffset={8}
        className="w-40 rounded-2xl border border-border bg-popover/95 backdrop-blur-md p-1.5 shadow-xl text-popover-foreground animate-in fade-in-50 zoom-in-95"
      >
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className={cn(
            "flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium cursor-pointer transition-colors",
            theme === "light"
              ? "bg-primary/10 text-primary font-semibold"
              : "text-foreground hover:bg-muted"
          )}
        >
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-amber-500" />
            <span>Light Mode</span>
          </div>
          {theme === "light" && <Check className="h-3.5 w-3.5 text-primary stroke-[2.5]" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className={cn(
            "flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium cursor-pointer transition-colors",
            theme === "dark"
              ? "bg-primary/10 text-primary font-semibold"
              : "text-foreground hover:bg-muted"
          )}
        >
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4 text-indigo-400" />
            <span>Dark Mode</span>
          </div>
          {theme === "dark" && <Check className="h-3.5 w-3.5 text-primary stroke-[2.5]" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className={cn(
            "flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium cursor-pointer transition-colors",
            theme === "system"
              ? "bg-primary/10 text-primary font-semibold"
              : "text-foreground hover:bg-muted"
          )}
        >
          <div className="flex items-center gap-2">
            <Laptop className="h-4 w-4 text-muted-foreground" />
            <span>System</span>
          </div>
          {theme === "system" && <Check className="h-3.5 w-3.5 text-primary stroke-[2.5]" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
