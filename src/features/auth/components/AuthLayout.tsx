import React from 'react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { LoginBackgroundAnimator } from '@/components/auth/LoginBackgroundAnimator';
import { InstitutionalLogos } from './InstitutionalLogos';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center lg:justify-end overflow-x-hidden overflow-y-auto p-4 sm:p-6 pt-20 sm:pt-24 lg:py-6 lg:pr-14 xl:pr-24">
      {/* Smooth Animated Pixel Art Background */}
      <LoginBackgroundAnimator fps={8.5} enableSmoothing={true} />

      {/* Institutional Logos at Top Left */}
      <InstitutionalLogos />

      {/* Floating Theme Toggle in Top Right */}
      <div className="fixed top-4 right-4 z-50 bg-background/80 dark:bg-card/80 backdrop-blur-md border border-border/80 rounded-full p-1 shadow-lg transition-all hover:scale-105">
        <ThemeToggle />
      </div>

      {children}
    </div>
  );
}

