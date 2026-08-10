"use client";

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { getPageTourConfig, isTourCompleted, startTourForPage } from '@/lib/tour-config';

interface TourContextType {
  startTour: (force?: boolean) => void;
}

const TourContext = createContext<TourContextType>({
  startTour: () => { },
});

export const useTour = () => useContext(TourContext);

export function TourProvider({
  children,
  isLoggedIn = true
}: {
  children: React.ReactNode;
  isLoggedIn?: boolean;
}) {
  const pathname = usePathname();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startCurrentTour = (force: boolean = true) => {
    startTourForPage(pathname, force);
  };

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Skip tours on auth or onboarding pages
    if (!isLoggedIn || pathname === '/login' || pathname === '/signup' || pathname === '/onboarding') {
      return;
    }

    const config = getPageTourConfig(pathname);
    if (!config) return;

    // If user has not completed this page's tour yet, auto-trigger after page content renders
    if (!isTourCompleted(config.key)) {
      timerRef.current = setTimeout(() => {
        startTourForPage(pathname, false);
      }, 900);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [pathname, isLoggedIn]);

  return (
    <TourContext.Provider value={{ startTour: startCurrentTour }}>
      {children}
    </TourContext.Provider>
  );
}
