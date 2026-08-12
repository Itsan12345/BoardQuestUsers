"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Mail,
  Lock,
  Loader2,
  Eye,
  EyeOff,
  Check,
  ShieldCheck,
  ArrowLeft,
  RefreshCw,
  Edit3,
  KeyRound,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { sendPasswordResetCode, verifyAndResetPassword } from '@/app/actions/auth';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { cn } from '@/lib/utils';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();

  // Step state: 'request' (enter email) -> 'reset' (enter OTP + new password)
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Focus states for visual feedback
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // 6-digit OTP code state
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [devCode, setDevCode] = useState<string | null>(null);

  // Validation rules
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isPasswordLongEnough = password.length >= 8;
  const hasPasswordNumber = /\d/.test(password);
  const hasPasswordSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isPasswordValid = isPasswordLongEnough && hasPasswordNumber && hasPasswordSpecial;
  const doPasswordsMatch = password.length > 0 && password === confirmPassword;

  const isOtpComplete = otp.every(digit => digit.length === 1);
  const isResetFormValid = isOtpComplete && isPasswordValid && doPasswordsMatch;

  // Countdown timer for Resend Code
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Auto-focus first OTP slot when switching to 'reset' step
  useEffect(() => {
    if (step === 'reset') {
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 150);
    }
  }, [step]);

  // Step 1: Request Password Reset Code
  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!isEmailValid) {
      toast({
        variant: "destructive",
        title: "Invalid Email",
        description: "Please provide a valid email address.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await sendPasswordResetCode(email);

      if (result.success) {
        setStep('reset');
        setResendCooldown(60);
        setOtp(['', '', '', '', '', '']);
        if (result.devCode) {
          setDevCode(result.devCode);
        }
        toast({
          title: "Recovery Code Dispatched",
          description: `A 6-digit password reset code was sent to ${email}.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Request Failed",
          description: result.error || "Failed to dispatch recovery code.",
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Handle OTP digit changes
  function handleOtpChange(index: number, value: string) {
    const sanitized = value.replace(/\D/g, '');
    if (!sanitized) {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }

    // Single digit input
    if (sanitized.length === 1) {
      const newOtp = [...otp];
      newOtp[index] = sanitized;
      setOtp(newOtp);
      if (index < 5) {
        otpInputsRef.current[index + 1]?.focus();
      }
    }
    // Paste full 6-digit code
    else if (sanitized.length >= 6) {
      const digits = sanitized.slice(0, 6).split('');
      setOtp(digits);
      otpInputsRef.current[5]?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length > 0) {
      const newOtp = [...otp];
      pastedData.split('').forEach((char, i) => {
        if (i < 6) newOtp[i] = char;
      });
      setOtp(newOtp);
      const focusIndex = Math.min(pastedData.length, 5);
      otpInputsRef.current[focusIndex]?.focus();
    }
  }

  // Resend OTP Code
  async function handleResendCode() {
    if (resendCooldown > 0 || isResending) return;

    setIsResending(true);
    try {
      const result = await sendPasswordResetCode(email);
      if (result.success) {
        setResendCooldown(60);
        setOtp(['', '', '', '', '', '']);
        if (result.devCode) {
          setDevCode(result.devCode);
        }
        toast({
          title: "New Code Dispatched",
          description: "A fresh recovery code has been sent to your email inbox.",
        });
        otpInputsRef.current[0]?.focus();
      } else {
        toast({
          variant: "destructive",
          title: "Resend Failed",
          description: result.error || "Failed to resend code. Please try again.",
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsResending(false);
    }
  }

  // Step 2: Verify Code and Reset Password
  async function handleResetSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isResetFormValid) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fulfill all required fields and criteria before submitting.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('code', otp.join(''));
      formData.append('password', password);
      formData.append('confirmPassword', confirmPassword);

      const result = await verifyAndResetPassword(formData);

      if (result.success) {
        toast({
          title: "Password Updated ✨",
          description: "Your credentials have been securely updated. Please log in.",
        });
        router.push('/login');
      } else {
        toast({
          variant: "destructive",
          title: "Reset Failed",
          description: result.error || "Failed to reset password.",
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center p-4 py-8">
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
            Password <span className="text-primary tracking-tight" style={{ fontFamily: "'Inter-bold', sans-serif" }}>Recovery</span>
          </CardTitle>

          <CardDescription className="text-xs font-bold uppercase text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
            {step === 'request'
              ? 'Enter your registered email to receive a recovery code'
              : 'Enter the 6-digit code and set your new password'}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-8 pt-2">
          {/* =========================================================================
              STEP 1: REQUEST RECOVERY CODE
             ========================================================================= */}
          {step === 'request' && (
            <form onSubmit={handleSendCode} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1" style={{ fontFamily: "'Inter-bold', sans-serif" }}>
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Username@phinmaed.com"
                    required
                    className="pl-10 h-12 bg-muted border border-slate-300 rounded-xl focus-visible:ring-primary/20 text-sm font-medium"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !isEmailValid}
                className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg transition-all active:scale-95 mt-2"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Dispatching Code...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4" />
                    <span>Send Recovery Code</span>
                  </div>
                )}
              </Button>

              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Return to Log In
                </Link>
              </div>
            </form>
          )}

          {/* =========================================================================
              STEP 2: VERIFY 6-DIGIT OTP & SET NEW PASSWORD
             ========================================================================= */}
          {step === 'reset' && (
            <form onSubmit={handleResetSubmit} className="space-y-5">
              {/* Recipient Email Chip */}
              <div className="p-3 bg-muted/60 border border-border/80 rounded-2xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider leading-tight">Code Sent To</p>
                    <p className="text-xs font-bold text-foreground truncate">{email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('request')}
                  className="flex items-center gap-1 text-[10px] font-bold uppercase text-primary hover:underline px-2 py-1 rounded-lg hover:bg-primary/5 transition-colors shrink-0"
                >
                  <Edit3 className="w-3 h-3" /> Change
                </button>
              </div>

              {/* Dev mode code banner */}
              {devCode && process.env.NODE_ENV === 'development' && (
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center">
                  <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                    🛠️ <strong>Dev Mode Code:</strong> <span className="font-mono tracking-widest font-black">{devCode}</span>
                  </p>
                </div>
              )}

              {/* 6-Digit OTP Box Grid */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black uppercase text-muted-foreground" style={{ fontFamily: "'Inter-bold', sans-serif" }}>
                    6-Digit Recovery Code
                  </label>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0 || isResending}
                    className={cn(
                      "text-[10px] font-bold uppercase flex items-center gap-1 transition-colors",
                      resendCooldown > 0 || isResending
                        ? "text-muted-foreground cursor-not-allowed opacity-70"
                        : "text-primary hover:underline"
                    )}
                  >
                    <RefreshCw className={cn("w-3 h-3", isResending && "animate-spin")} />
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                  </button>
                </div>

                <div className="grid grid-cols-6 gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={el => { otpInputsRef.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(index, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      className={cn(
                        "w-full h-12 sm:h-14 text-center text-xl sm:text-2xl font-black font-mono rounded-xl border-2 transition-all outline-none bg-background",
                        digit
                          ? "border-primary text-primary bg-primary/5 shadow-xs"
                          : "border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground"
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1" style={{ fontFamily: "'Inter-bold', sans-serif" }}>
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setIsPasswordFocused(true)}
                    placeholder="••••••••"
                    required
                    className="pl-10 pr-10 h-12 bg-muted border border-slate-300 rounded-xl focus-visible:ring-primary/20 text-sm font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-slate-600 focus:outline-none transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Real-time Password Criteria Checklist */}
                {(isPasswordFocused || password.length > 0) && (
                  <div className="p-3 bg-muted/50 border border-border/80 rounded-xl space-y-1.5 animate-in fade-in duration-200 mt-1">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-1">
                      Password Requirements
                    </p>
                    <div className="grid grid-cols-1 gap-1 text-[11px]">
                      <div className={cn("flex items-center gap-1.5", isPasswordLongEnough ? "text-emerald-600 font-bold" : "text-muted-foreground")}>
                        <Check className={cn("w-3.5 h-3.5", isPasswordLongEnough ? "opacity-100" : "opacity-30")} />
                        <span>At least 8 characters long</span>
                      </div>
                      <div className={cn("flex items-center gap-1.5", hasPasswordNumber ? "text-emerald-600 font-bold" : "text-muted-foreground")}>
                        <Check className={cn("w-3.5 h-3.5", hasPasswordNumber ? "opacity-100" : "opacity-30")} />
                        <span>Contains at least 1 number</span>
                      </div>
                      <div className={cn("flex items-center gap-1.5", hasPasswordSpecial ? "text-emerald-600 font-bold" : "text-muted-foreground")}>
                        <Check className={cn("w-3.5 h-3.5", hasPasswordSpecial ? "opacity-100" : "opacity-30")} />
                        <span>Contains 1 special character (!@#$%^&*)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1" style={{ fontFamily: "'Inter-bold', sans-serif" }}>
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className={cn(
                      "pl-10 pr-10 h-12 bg-muted border rounded-xl focus-visible:ring-primary/20 text-sm font-medium transition-all",
                      confirmPassword.length > 0
                        ? doPasswordsMatch
                          ? "border-emerald-500 bg-emerald-50/10"
                          : "border-red-400 bg-red-50/10"
                        : "border-slate-300"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-slate-600 focus:outline-none transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword.length > 0 && !doPasswordsMatch && (
                  <p className="text-[10px] font-bold text-red-600 ml-1">Passwords do not match.</p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading || !isResetFormValid}
                className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg transition-all active:scale-95 mt-4"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Resetting Credentials...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Reset Password & Log In</span>
                  </div>
                )}
              </Button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setStep('request')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Email Entry
                </button>
              </div>
            </form>
          )}

          <div className="mt-8 text-center pt-4 border-t border-border/60">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Remember your password?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Log In
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
