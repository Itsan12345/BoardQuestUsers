"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, Loader2, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { login } from '@/app/actions/auth';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { LoginBackgroundAnimator } from '@/components/auth/LoginBackgroundAnimator';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  function handleNavigate(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    e.preventDefault();
    if (isNavigating) return;
    setIsNavigating(true);
    setTimeout(() => {
      router.push(href);
    }, 180);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await login(formData);

    if (result.success) {
      try {
        sessionStorage.setItem('bq_just_logged_in', 'true');
        sessionStorage.removeItem('bq_daily_modal_dismissed');
      } catch (e) { }
      toast({
        title: "Verification Successful",
        description: "Welcome back, Aspirant. Re-establishing mission parameters.",
      });
      router.push('/');
    } else {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: result.error || "Invalid credentials.",
      });
    }
    setIsLoading(false);
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center lg:justify-end overflow-x-hidden overflow-y-auto p-4 sm:p-6 pt-20 sm:pt-24 lg:py-6 lg:pr-14 xl:pr-24">
      {/* Smooth Animated Pixel Art Background */}
      <LoginBackgroundAnimator fps={8.5} enableSmoothing={true} />

      {/* Institutional Logos at Top Left */}
      <div className="fixed top-4 left-4 sm:top-6 sm:left-6 z-50 flex items-center gap-2.5 sm:gap-3.5 select-none pointer-events-auto">
        <div className="relative w-11 h-11 sm:w-14 sm:h-14 transition-transform hover:scale-105 duration-200">
          <Image
            src="/images/login-signup/SWU_Logo.png"
            alt="Southwestern University PHINMA Logo"
            width={64}
            height={64}
            priority
            className="w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
          />
        </div>
        <div className="relative w-11 h-11 sm:w-14 sm:h-14 transition-transform hover:scale-105 duration-200">
          <Image
            src="/images/login-signup/MedTech_Logo.png"
            alt="Medical Technology Logo"
            width={64}
            height={64}
            priority
            className="w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
          />
        </div>
      </div>

      {/* Floating Theme Toggle in Top Right */}
      <div className="fixed top-4 right-4 z-50 bg-background/80 dark:bg-card/80 backdrop-blur-md border border-border/80 rounded-full p-1 shadow-lg transition-all hover:scale-105">
        <ThemeToggle />
      </div>

      {/* Login Card styled to match Forgot Password Page with smooth transition */}
      <Card
        className={cn(
          "relative z-10 max-w-md w-full border border-border shadow-2xl rounded-[2.5rem] overflow-hidden bg-card transform-gpu",
          isNavigating
            ? "opacity-0 scale-[0.97] -translate-y-2 transition-all duration-200 ease-in"
            : "animate-in fade-in-0 zoom-in-[0.98] slide-in-from-bottom-2 duration-300 ease-out"
        )}
      >
        <CardHeader className="p-8 pb-3 text-center space-y-1">
          {/* Logo Mark */}
          <div className="flex items-center justify-center">
            <Image
              src="/images/boardquestlogo2.png"
              alt="BoardQuest Logo"
              width={56}
              height={56}
              priority
              className="w-20 h-20 -mb-3 object-contain"
            />
          </div>

          {/* BOARDQUEST Branding Title */}
          <h1
            className="text-2xl font-bold tracking-tight text-foreground"
            style={{ fontFamily: "'Akira Expanded', sans-serif" }}
          >
            BOARDQUEST
          </h1>

          {/* Aspirant LOG IN Header */}
          <CardTitle
            className="text-xl font-black uppercase tracking-widest text-foreground"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            ASPIRANT{" "}
            <span
              className="text-[#851315] dark:text-[#dc2626] tracking-tight font-black"
              style={{ fontFamily: "'Inter-bold', sans-serif" }}
            >
              LOG IN
            </span>
          </CardTitle>

          {/* Subtitle Description */}
          <CardDescription
            className="text-xs font-bold uppercase text-muted-foreground leading-tight"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            ENTER YOUR CREDENTIALS TO CONTINUE THE REVIEW
          </CardDescription>
        </CardHeader>

        <CardContent className="p-8 pt-2">
          {/* Form fields with closed gap matching reference image */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Address */}
            <div className="space-y-1.5">
              <label
                className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-wider block"
                style={{ fontFamily: "'Inter-bold', sans-serif" }}
              >
                EMAIL ADRESS
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  name="email"
                  type="email"
                  placeholder="Username@gmail.com"
                  required
                  className="pl-10 h-12 bg-muted border border-slate-300 dark:border-slate-700 text-foreground placeholder:text-muted-foreground rounded-xl focus-visible:ring-primary/20 text-sm font-medium"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <label
                  className="text-[10px] font-black uppercase text-muted-foreground tracking-wider"
                  style={{ fontFamily: "'Inter-bold', sans-serif" }}
                >
                  PASSWORD
                </label>
                <Link
                  href="/forgot-password"
                  onClick={(e) => handleNavigate(e, '/forgot-password')}
                  className="text-[10px] font-bold text-[#851315] dark:text-[#dc2626] hover:underline uppercase tracking-wider"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••••••••••"
                  required
                  className="pl-10 pr-10 h-12 bg-muted border border-slate-300 dark:border-slate-700 text-foreground placeholder:text-muted-foreground rounded-xl focus-visible:ring-primary/20 text-sm font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Crimson Button */}
            <Button
              type="submit"
              className="w-full h-14 bg-[#851315] hover:bg-[#720e10] active:scale-[0.98] text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg shadow-red-950/20 transition-all flex items-center justify-center gap-2 mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>LOGGING IN...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>LOG IN</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </div>
              )}
            </Button>
          </form>

          {/* Footer Call to Action */}
          <div className="mt-6 text-center pt-4 border-t border-border/60">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              NEW TO EXPEDITION?{" "}
              <Link
                href="/signup"
                onClick={(e) => handleNavigate(e, '/signup')}
                className="text-[#851315] dark:text-[#dc2626] font-black hover:underline transition-colors ml-1"
              >
                ENROLL NOW
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


