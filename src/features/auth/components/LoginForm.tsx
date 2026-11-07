"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, Loader2, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useLoginForm } from '../hooks';
import { AuthLayout } from './AuthLayout';
import { cn } from '@/lib/utils';

export function LoginForm() {
  const {
    isLoading,
    showPassword,
    setShowPassword,
    isNavigating,
    handleNavigate,
    handleSubmit,
  } = useLoginForm();

  return (
    <AuthLayout>
      <Card
        className={cn(
          'relative z-10 max-w-md w-full border border-border shadow-2xl rounded-[2.5rem] overflow-hidden bg-card transform-gpu',
          isNavigating
            ? 'opacity-0 scale-[0.97] -translate-y-2 transition-all duration-200 ease-in'
            : 'animate-in fade-in-0 zoom-in-[0.98] slide-in-from-bottom-2 duration-300 ease-out'
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
            ASPIRANT{' '}
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
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••••••••••"
                  required
                  className="pl-10 pr-10 h-12 bg-muted border border-slate-300 dark:border-slate-700 text-foreground placeholder:text-muted-foreground rounded-xl focus-visible:ring-primary/20 text-sm font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
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
              NEW TO EXPEDITION?{' '}
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
    </AuthLayout>
  );
}

