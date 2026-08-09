"use client";

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Compass, Sparkles, HelpCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getPageTourConfig, isTourCompleted, startTourForPage, resetAllTours } from '@/lib/tour-config';
import { useToast } from '@/hooks/use-toast';

export function TourButton() {
  const pathname = usePathname();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [hasUnseenTour, setHasUnseenTour] = useState(false);

  const config = getPageTourConfig(pathname);

  useEffect(() => {
    setMounted(true);
    if (config) {
      setHasUnseenTour(!isTourCompleted(config.key));
    } else {
      setHasUnseenTour(false);
    }
  }, [pathname, config]);

  if (!mounted || !config) return null;

  const handleStartTour = () => {
    const started = startTourForPage(pathname, true);
    if (started) {
      setHasUnseenTour(false);
    } else {
      toast({
        title: "Tour Unavailable",
        description: "The interactive guide is loading or not available for this view.",
      });
    }
  };

  const handleResetAll = () => {
    resetAllTours();
    setHasUnseenTour(true);
    toast({
      title: "Guides Reset ✨",
      description: "Interactive page walkthroughs have been reset and will trigger on each page.",
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative h-8 w-8 sm:h-9 sm:w-auto sm:px-3 p-0 rounded-xl border border-border/80 hover:border-primary/40 hover:bg-primary/5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all text-foreground/80 hover:text-primary shadow-xs shrink-0"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          title="Interactive Feature Guide"
        >
          <Compass className="w-4 h-4 text-primary shrink-0 transition-transform group-hover:rotate-45" />
          <span className="hidden sm:inline font-bold uppercase tracking-wider text-[11px]">Guide</span>
          {hasUnseenTour && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" collisionPadding={10} sideOffset={8} className="w-56 rounded-2xl p-2 shadow-xl border border-border bg-background">
        <DropdownMenuLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground px-2 py-1.5 truncate">
          {config.name}
        </DropdownMenuLabel>
        <DropdownMenuItem
          onClick={handleStartTour}
          className="rounded-xl px-2.5 py-2 cursor-pointer font-semibold text-xs flex items-center gap-2 text-foreground hover:text-primary focus:text-primary"
        >
          <Sparkles className="w-4 h-4 text-primary shrink-0" />
          <span>Start Page Tour</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-1" />
        <DropdownMenuItem
          onClick={handleResetAll}
          className="rounded-xl px-2.5 py-2 cursor-pointer text-xs flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="w-3.5 h-3.5 shrink-0" />
          <span>Reset All Page Tours</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
