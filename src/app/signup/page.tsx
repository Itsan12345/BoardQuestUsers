"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Mail,
  Lock,
  User,
  Loader2,
  Eye,
  EyeOff,
  Check,
  ShieldCheck,
  ArrowLeft,
  RefreshCw,
  Edit3,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { sendVerificationCode, verifyEmailAndSignUp } from '@/app/actions/auth';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { LoginBackgroundAnimator } from '@/components/auth/LoginBackgroundAnimator';
import { cn } from '@/lib/utils';

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // Step state: 'info' (Fill registration details) -> 'verify' (Verify 6-digit OTP)
  const [step, setStep] = useState<'info' | 'verify'>('info');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  function handleNavigate(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    e.preventDefault();
    if (isNavigating) return;
    setIsNavigating(true);
    setTimeout(() => {
      router.push(href);
    }, 180);
  }
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  
  const [password, setPassword] = useState('');
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 6-digit OTP code state
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [devCode, setDevCode] = useState<string | null>(null);

  // Validation rules
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const hasNoSpacesEmail = email.length > 0 && !/\s/.test(email);

  const isPasswordLongEnough = password.length >= 8;
  const hasPasswordNumber = /\d/.test(password);
  const hasPasswordSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isPasswordValid = isPasswordLongEnough && hasPasswordNumber && hasPasswordSpecial;

  const isInfoFormValid = name.trim().length > 0 && isEmailValid && hasNoSpacesEmail && isPasswordValid;

  // Countdown timer for Resend Code
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Auto-focus first OTP slot when switching to 'verify' step
  useEffect(() => {
    if (step === 'verify') {
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 150);
    }
  }, [step]);

  // Step 1: Send verification code to email
  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!isInfoFormValid) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fulfill all required fields and criteria before proceeding.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await sendVerificationCode(email, name);

      if (result.success) {
        setStep('verify');
        setResendCooldown(60);
        setOtp(['', '', '', '', '', '']);
        if (result.devCode) {
          setDevCode(result.devCode);
        }
        toast({
          title: "Verification Code Sent",
          description: `A 6-digit code has been dispatched to ${email}.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Verification Failed",
          description: result.error || "Failed to dispatch verification code.",
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

  // Resend code handler
  async function handleResendCode() {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    try {
      const result = await sendVerificationCode(email, name);
      if (result.success) {
        setResendCooldown(60);
        if (result.devCode) {
          setDevCode(result.devCode);
        }
        toast({
          title: "Code Resent",
          description: `New verification code sent to ${email}.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Resend Failed",
          description: result.error || "Could not resend code.",
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to resend code. Please try again.",
      });
    } finally {
      setIsResending(false);
    }
  }

  // Handle OTP digit changes
  function handleOtpChange(index: number, value: string) {
    const cleanValue = value.replace(/\D/g, '');
    if (!cleanValue) {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }

    // Handle single digit input
    const singleDigit = cleanValue[cleanValue.length - 1];
    const newOtp = [...otp];
    newOtp[index] = singleDigit;
    setOtp(newOtp);

    // Auto advance to next slot
    if (index < 5 && singleDigit) {
      otpInputsRef.current[index + 1]?.focus();
    }
  }

  // Handle backspace and navigation keys
  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        otpInputsRef.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  }

  // Handle pasting full 6-digit code
  function handleOtpPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pastedData[i] || '';
    }
    setOtp(newOtp);

    // Focus last filled index or first empty index
    const nextFocusIndex = Math.min(pastedData.length, 5);
    otpInputsRef.current[nextFocusIndex]?.focus();
  }

  // Step 2: Finalize verification and create user
  async function handleVerifyAndSignUp(e: React.FormEvent) {
    e.preventDefault();
    const fullCode = otp.join('');
    if (fullCode.length !== 6) {
      toast({
        variant: "destructive",
        title: "Incomplete Code",
        description: "Please enter the complete 6-digit verification code.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('code', fullCode);

      const result = await verifyEmailAndSignUp(formData);

      if (result.success) {
        try {
          sessionStorage.setItem('bq_just_logged_in', 'true');
          sessionStorage.removeItem('bq_daily_modal_dismissed');
          localStorage.removeItem('bq_pref_target_exam_date');
          localStorage.removeItem('bq_pref_target_batch');
          localStorage.removeItem('bq_pref_school');
          localStorage.setItem('bq_pref_focus_subject', 'none');
          localStorage.removeItem('bq_read_notifications');
        } catch (e) {}
        toast({
          title: "Account Verified & Created",
          description: "Welcome to BoardQuest! Expedition initialized.",
        });
        router.push('/');
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "Verification Failed",
          description: result.error || "Invalid verification code.",
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Signup Error",
        description: "An unexpected error occurred during account registration.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center lg:justify-end overflow-hidden p-4 sm:p-6 lg:pr-14 xl:pr-24">
      {/* Smooth Animated Pixel Art Background */}
      <LoginBackgroundAnimator fps={8.5} enableSmoothing={true} />

      {/* Floating Theme Toggle in Top Right */}
      <div className="fixed top-4 right-4 z-50 bg-background/80 dark:bg-card/80 backdrop-blur-md border border-border/80 rounded-full p-1 shadow-lg transition-all hover:scale-105">
        <ThemeToggle />
      </div>

      {/* SignUp Card matching Forgot Password Page container with smooth transition */}
      <Card
        className={cn(
          "relative z-10 max-w-md w-full border border-border shadow-2xl rounded-[2.5rem] overflow-visible bg-card transform-gpu",
          isNavigating
            ? "opacity-0 scale-[0.97] -translate-y-2 transition-all duration-200 ease-in"
            : "animate-in fade-in-0 zoom-in-[0.98] slide-in-from-bottom-2 duration-300 ease-out"
        )}
      >
        <CardHeader className="px-8 pt-7 pb-2 text-center space-y-1">
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

          {/* Aspirant ENROLL Header */}
          <CardTitle
            className="text-xl font-black uppercase tracking-widest text-foreground"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            ASPIRANT{" "}
            <span
              className="text-[#851315] dark:text-[#dc2626] tracking-tight font-black"
              style={{ fontFamily: "'Inter-bold', sans-serif" }}
            >
              ENROLL
            </span>
          </CardTitle>

          {/* Subtitle Description */}
          <CardDescription
            className="text-xs font-bold uppercase text-muted-foreground leading-tight"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {step === 'info' ? (
              <>JOIN AND DEPLOY YOUR BOARD REVIEW STRATEGY</>
            ) : (
              <>VERIFY YOUR EMAIL TO INITIALIZE EXPEDITION</>
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-8 pt-2 pb-6">
          {step === 'info' ? (
            /* ================= STEP 1: ASPIRANT INFORMATION ================= */
            <form onSubmit={handleSendCode} className="space-y-3 animate-in fade-in-0 zoom-in-[0.99] duration-250 ease-out">
              {/* Full Name */}
              <div className="space-y-1">
                <label
                  className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-wider block"
                  style={{ fontFamily: "'Inter-bold', sans-serif" }}
                >
                  FULL NAME*
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Aspirant Alex Rivera"
                    required
                    className="pl-10 h-11 bg-muted border border-slate-300 dark:border-slate-700 text-foreground placeholder:text-muted-foreground rounded-xl focus-visible:ring-primary/20 text-sm font-medium"
                  />
                </div>
              </div>
              
              {/* Email Address */}
              <div className="space-y-1 relative">
                <label
                  className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-wider block"
                  style={{ fontFamily: "'Inter-bold', sans-serif" }}
                >
                  EMAIL ADRESS*
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    name="email"
                    type="email"
                    placeholder="alex@medtech.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setIsEmailFocused(true)}
                    onBlur={() => setIsEmailFocused(false)}
                    className={`pl-10 h-11 bg-muted border ${
                      !isEmailValid && email.length > 0
                        ? 'border-red-500 ring-1 ring-red-500'
                        : 'border-slate-300 dark:border-slate-700'
                    } text-foreground placeholder:text-muted-foreground rounded-xl focus-visible:ring-primary/20 text-sm font-medium`}
                  />
                  
                  {/* Email Validation Popover */}
                  {isEmailFocused && (
                    <div className="absolute left-[calc(100%+0.75rem)] top-1/2 -translate-y-1/2 w-60 bg-background rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-3 border border-border z-50 hidden lg:block">
                      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-background border-l border-b border-border rotate-45 rounded-tl-sm" />
                      <div className="space-y-2 relative z-10">
                        <div className="flex items-center gap-2.5">
                          <div className={`rounded-full p-0.5 flex-shrink-0 transition-colors ${isEmailValid ? 'bg-[#851315] text-white' : 'bg-slate-200 dark:bg-slate-700 text-muted-foreground'}`}>
                            <Check className="w-3 h-3" strokeWidth={4} />
                          </div>
                          <span className="text-xs font-bold text-foreground">Must contain valid email address.</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <div className={`rounded-full p-0.5 flex-shrink-0 transition-colors ${hasNoSpacesEmail ? 'bg-[#851315] text-white' : 'bg-slate-200 dark:bg-slate-700 text-muted-foreground'}`}>
                            <Check className="w-3 h-3" strokeWidth={4} />
                          </div>
                          <span className="text-xs font-bold text-foreground">No spaces allowed.</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1 relative">
                <label
                  className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-wider block"
                  style={{ fontFamily: "'Inter-bold', sans-serif" }}
                >
                  PASSWORD*
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    className="pl-10 pr-10 h-11 bg-muted border border-slate-300 dark:border-slate-700 text-foreground placeholder:text-muted-foreground rounded-xl focus-visible:ring-primary/20 text-sm font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>

                  {/* Password Validation Popover */}
                  {isPasswordFocused && (
                    <div className="absolute left-[calc(100%+0.75rem)] top-1/2 -translate-y-1/2 w-60 bg-background rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-3 border border-border z-50 hidden lg:block">
                      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-background border-l border-b border-border rotate-45 rounded-tl-sm" />
                      <div className="space-y-2 relative z-10">
                        <div className="flex items-center gap-2.5">
                          <div className={`rounded-full p-0.5 flex-shrink-0 transition-colors ${isPasswordLongEnough ? 'bg-[#851315] text-white' : 'bg-slate-200 dark:bg-slate-700 text-muted-foreground'}`}>
                            <Check className="w-3 h-3" strokeWidth={4} />
                          </div>
                          <span className="text-xs font-bold text-foreground">At least 8 characters.</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <div className={`rounded-full p-0.5 flex-shrink-0 transition-colors ${hasPasswordNumber ? 'bg-[#851315] text-white' : 'bg-slate-200 dark:bg-slate-700 text-muted-foreground'}`}>
                            <Check className="w-3 h-3" strokeWidth={4} />
                          </div>
                          <span className="text-xs font-bold text-foreground">Contains a number.</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <div className={`rounded-full p-0.5 flex-shrink-0 transition-colors ${hasPasswordSpecial ? 'bg-[#851315] text-white' : 'bg-slate-200 dark:bg-slate-700 text-muted-foreground'}`}>
                            <Check className="w-3 h-3" strokeWidth={4} />
                          </div>
                          <span className="text-xs font-bold text-foreground">Contains a special character.</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <Button
                type="submit"
                className="w-full h-12.5 bg-[#851315] hover:bg-[#720e10] active:scale-[0.98] text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg shadow-red-950/20 transition-all flex items-center justify-center gap-2 mt-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>SENDING CODE...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>VERIFY EMAIL & CONTINUE</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </div>
                )}
              </Button>
            </form>
          ) : (
            /* ================= STEP 2: EMAIL OTP VERIFICATION ================= */
            <form onSubmit={handleVerifyAndSignUp} className="space-y-4 animate-in fade-in-0 zoom-in-[0.99] duration-250 ease-out">
              {/* Email summary badge with edit action */}
              <div className="bg-muted border border-border rounded-xl p-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#851315]/10 flex items-center justify-center shrink-0 text-[#851315] dark:text-[#dc2626]">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                      Verification Code Sent To
                    </p>
                    <p className="text-xs font-bold text-foreground truncate">
                      {email}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('info')}
                  className="text-xs font-bold text-[#851315] dark:text-[#dc2626] hover:underline flex items-center gap-1 shrink-0 px-2 py-1 rounded-lg hover:bg-[#851315]/5 transition-colors"
                >
                  <Edit3 className="w-3 h-3" />
                  Edit
                </button>
              </div>

              {/* Dev Mode Notification / Helper Banner */}
              {devCode && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 text-center">
                  <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                    Development OTP Code: <span className="font-mono text-sm tracking-widest font-black text-amber-700 dark:text-amber-300">{devCode}</span>
                  </p>
                </div>
              )}

              {/* 6-Digit OTP Inputs */}
              <div className="space-y-2">
                <label
                  className="text-[10px] font-black uppercase text-muted-foreground ml-1 block text-center tracking-widest"
                  style={{ fontFamily: "'Inter-bold', sans-serif" }}
                >
                  ENTER 6-DIGIT CODE*
                </label>
                <div className="flex items-center justify-center gap-2" onPaste={handleOtpPaste}>
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputsRef.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className={`w-11 h-12 text-center text-xl font-black rounded-xl bg-muted border ${
                        digit
                          ? 'border-[#851315] dark:border-[#dc2626] ring-2 ring-[#851315]/20 bg-background text-foreground'
                          : 'border-slate-300 dark:border-slate-700 text-foreground'
                      } focus:outline-none focus:border-[#851315] focus:ring-2 focus:ring-[#851315]/20 transition-all font-mono`}
                    />
                  ))}
                </div>
              </div>

              {/* Resend Code Section */}
              <div className="text-center pt-1">
                {resendCooldown > 0 ? (
                  <p className="text-xs font-bold text-muted-foreground">
                    Resend code in <span className="text-[#851315] dark:text-[#dc2626] font-mono font-black">{Math.floor(resendCooldown / 60)}:{String(resendCooldown % 60).padStart(2, '0')}</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={isResending}
                    className="text-xs font-bold text-[#851315] dark:text-[#dc2626] hover:underline inline-flex items-center gap-1 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`} />
                    {isResending ? 'Sending new code...' : "Didn't receive code? Resend Code"}
                  </button>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-1">
                <Button
                  type="submit"
                  className="w-full h-12.5 bg-[#851315] hover:bg-[#720e10] active:scale-[0.98] text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg shadow-red-950/20 transition-all flex items-center justify-center gap-2"
                  disabled={isLoading || otp.join('').length !== 6}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>VERIFYING...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>VERIFY & ENROLL</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </div>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep('info')}
                  className="w-full h-9 rounded-xl text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                  Back to Details
                </Button>
              </div>
            </form>
          )}

          {/* Footer Call to Action */}
          <div className="mt-4 text-center border-t border-border/60 pt-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              ALREADY AN ASPIRANT?{" "}
              <Link
                href="/login"
                onClick={(e) => handleNavigate(e, '/login')}
                className="text-[#851315] dark:text-[#dc2626] font-black hover:underline transition-colors ml-1"
              >
                LOG IN
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
