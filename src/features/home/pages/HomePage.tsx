"use client";

import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { HomeDashboard } from '../components/HomeDashboard';

export function HomePage() {
  return (
    <ProtectedRoute>
      <HomeDashboard />
    </ProtectedRoute>
  );
}

export default HomePage;

