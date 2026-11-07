"use client";

import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { ProfileDashboard } from '../components/ProfileDashboard';

export function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      }
    >
      <ProfileDashboard />
    </Suspense>
  );
}

export default ProfilePage;

