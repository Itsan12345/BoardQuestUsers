"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { login } from '@/app/actions/auth';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const result = await login(formData);

    if (result.success) {
      try {
        sessionStorage.setItem('bq_just_logged_in', 'true');
        sessionStorage.removeItem('bq_daily_modal_dismissed');
      } catch (e) {}
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
    <div className="relative min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <Card className="max-w-md w-full border border-border shadow-2xl rounded-[2.5rem] overflow-hidden bg-card">
        <CardHeader className="p-8 pb-4 text-center space-y-1">
          <div className="flex items-center justify-center">
            <Image
              src="/images/boardquestlogo2.png"
              alt="BoardQuest Logo"
              width={56}
              height={56}
              className="w-20 h-20 -mb-3"
            />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-foreground" style={{ fontFamily: "'Akira Expanded', sans-serif" }}>
            BOARDQUEST
          </h1>

          <CardTitle className="text-xl font-black uppercase tracking-widest text-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
            Aspirant <span className="text-primary tracking-tight" style={{ fontFamily: "'Inter-bold', sans-serif"}}>LogIn</span>
          </CardTitle>
          <CardDescription className="text-xs font-bold uppercase align-center text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
            Enter your credentials to continue the<br />review
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-1" style={{ fontFamily: "'Inter-bold', sans-serif"}}>Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  name="email" 
                  type="email" 
                  placeholder="Username@phinmaed.com" 
                  required 
                  className="pl-10 h-12 bg-muted border border-slate-300 rounded-xl focus-visible:ring-primary/20"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black uppercase text-muted-foreground" style={{ fontFamily: "'Inter-bold', sans-serif"}}>Password</label>
                <Link
                  href="/forgot-password"
                  className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  name="password" 
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••" 
                  required 
                  className="pl-10 pr-10 h-12 bg-muted border border-slate-300 rounded-xl focus-visible:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-slate-600 focus:outline-none transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg transition-all active:scale-95 mt-4"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <>
                  LOG IN
                </>
              )}
            </Button>
          </form>
          <div className="mt-8 text-center">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              New to the expedition? <Link href="/signup" className="text-primary hover:underline">Sign Up</Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
