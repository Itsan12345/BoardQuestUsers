
import type {Metadata} from 'next';
import 'driver.js/dist/driver.css';
import '@/styles/tour-theme.css';
import './globals.css';
import {Toaster} from '@/components/ui/toaster';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/navigation/AppSidebar';
import { BottomNav } from '@/components/navigation/BottomNav';
import { ShieldCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { LayoutContent } from '@/components/navigation/LayoutContent';

export const metadata: Metadata = {
  title: 'BoardQuest | MedTech Gamified Review',
  description: 'AI-assisted gamified board review system for Medical Technology students.',
};

export default async function RootLayer({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@400;500;600;700;800;900&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen bg-background">
        <SidebarProvider>
          <LayoutContent isLoggedIn={!!userId}>
            {children}
          </LayoutContent>
          <Toaster />
        </SidebarProvider>
      </body>
    </html>
  );
}
