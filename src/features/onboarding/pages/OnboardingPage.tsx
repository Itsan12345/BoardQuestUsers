"use client";

import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { OnboardingView } from '../components/OnboardingView';

export function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <OnboardingView />
    </Suspense>
  );
}

export default OnboardingPage;

