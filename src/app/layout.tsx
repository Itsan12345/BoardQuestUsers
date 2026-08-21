
import type {Metadata} from 'next';
import { Inter, Poppins, Space_Grotesk } from 'next/font/google';
import 'driver.js/dist/driver.css';
import '@/styles/tour-theme.css';
import './globals.css';
import {Toaster} from '@/components/ui/toaster';
import { SidebarProvider } from '@/components/ui/sidebar';
import { cookies } from 'next/headers';
import { LayoutContent } from '@/components/navigation/LayoutContent';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const poppins = Poppins({
  weight: ['400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

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
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${poppins.variable} ${spaceGrotesk.variable}`}>
      <body className="font-body antialiased min-h-screen bg-background text-foreground transition-colors duration-200">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <SidebarProvider>
            <LayoutContent isLoggedIn={!!userId}>
              {children}
            </LayoutContent>
            <Toaster />
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

