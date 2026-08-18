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
  Edit3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { sendVerificationCode, verifyEmailAndSignUp } from '@/app/actions/auth';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // Step state: 'info' (Fill registration details) -> 'verify' (Verify 6-digit OTP)
  const [step, setStep] = useState<'info' | 'verify'>('info');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  
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
    <div className="relative min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <Card className="max-w-md w-full border border-border shadow-2xl rounded-[2.5rem] bg-card overflow-visible">
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

          <h1 className="text-2xl font-bold tracking-tight text-foreground -mt-1" style={{ fontFamily: "'Akira Expanded', sans-serif" }}>
            BOARDQUEST
          </h1>

          <CardTitle className="text-xl font-black uppercase tracking-widest text-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
            Aspirant <span className="text-primary tracking-tight" style={{ fontFamily: "'Inter-bold', sans-serif"}}>Enroll</span>
          </CardTitle>
          <CardDescription className="text-xs font-bold uppercase align-center text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
            {step === 'info' ? (
              <>JOIN AND DEPLOY YOUR BOARD REVIEW<br />STRATEGY</>
            ) : (
              <>VERIFY YOUR EMAIL TO INITIALIZE<br />EXPEDITION</>
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-8 pt-0">
          {step === 'info' ? (
            /* ================= STEP 1: ASPIRANT INFORMATION ================= */
            <form onSubmit={handleSendCode} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1" style={{ fontFamily: "'Inter-bold', sans-serif"}}>
                  Full Name*
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Aspirant Alex Rivera"
                    required
                    className="pl-10 h-12 bg-muted border border-slate-300 rounded-xl focus-visible:ring-primary/20"
                  />
                </div>
              </div>
              
              {/* Email Address */}
              <div className="space-y-2 relative">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1" style={{ fontFamily: "'Inter-bold', sans-serif"}}>
                  Email Address*
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    name="email"
                    type="email"
                    placeholder="alex@medtech.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setIsEmailFocused(true)}
                    onBlur={() => setIsEmailFocused(false)}
                    className={`pl-10 h-12 bg-muted border ${!isEmailValid && email.length > 0 ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} rounded-xl focus-visible:ring-primary/20`}
                  />
                  
                  {/* Email Validation Popover */}
                  {isEmailFocused && (
                    <div className="absolute left-[calc(100%+1rem)] top-1/2 -translate-y-1/2 w-64 bg-background rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-4 border border-border z-50 hidden lg:block">
                      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-background border-l border-b border-border rotate-45 rounded-tl-sm" />
                      <div className="space-y-3 relative z-10">
                        <div className="flex items-center gap-3">
                          <div className={`rounded-full p-0.5 flex-shrink-0 transition-colors ${isEmailValid ? 'bg-[#d32f2f] text-white' : 'bg-slate-200 text-muted-foreground'}`}>
                            <Check className="w-3.5 h-3.5" strokeWidth={4} />
                          </div>
                          <span className="text-sm font-bold text-foreground">Must contain valid email address.</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`rounded-full p-0.5 flex-shrink-0 transition-colors ${hasNoSpacesEmail ? 'bg-[#d32f2f] text-white' : 'bg-slate-200 text-muted-foreground'}`}>
                            <Check className="w-3.5 h-3.5" strokeWidth={4} />
                          </div>
                          <span className="text-sm font-bold text-foreground">No spaces allowed.</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2 relative">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1" style={{ fontFamily: "'Inter-bold', sans-serif"}}>
                  Password*
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    className="pl-10 pr-10 h-12 bg-muted border border-slate-300 rounded-xl focus-visible:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-slate-600 focus:outline-none transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>

                  {/* Password Validation Popover */}
                  {isPasswordFocused && (
                    <div className="absolute left-[calc(100%+1rem)] top-1/2 -translate-y-1/2 w-64 bg-background rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-4 border border-border z-50 hidden lg:block">
                      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-background border-l border-b border-border rotate-45 rounded-tl-sm" />
                      <div className="space-y-3 relative z-10">
                        <div className="flex items-center gap-3">
                          <div className={`rounded-full p-0.5 flex-shrink-0 transition-colors ${isPasswordLongEnough ? 'bg-[#d32f2f] text-white' : 'bg-slate-200 text-muted-foreground'}`}>
                            <Check className="w-3.5 h-3.5" strokeWidth={4} />
                          </div>
                          <span className="text-sm font-bold text-foreground">At least 8 characters.</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`rounded-full p-0.5 flex-shrink-0 transition-colors ${hasPasswordNumber ? 'bg-[#d32f2f] text-white' : 'bg-slate-200 text-muted-foreground'}`}>
                            <Check className="w-3.5 h-3.5" strokeWidth={4} />
                          </div>
                          <span className="text-sm font-bold text-foreground">Contains a number.</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`rounded-full p-0.5 flex-shrink-0 transition-colors ${hasPasswordSpecial ? 'bg-[#d32f2f] text-white' : 'bg-slate-200 text-muted-foreground'}`}>
                            <Check className="w-3.5 h-3.5" strokeWidth={4} />
                          </div>
                          <span className="text-sm font-bold text-foreground">Contains a special character.</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <Button
                type="submit"
                className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg transition-all active:scale-95 mt-4"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Sending Code...</span>
                  </div>
                ) : (
                  <>Verify Email & Continue</>
                )}
              </Button>
            </form>
          ) : (
            /* ================= STEP 2: EMAIL OTP VERIFICATION ================= */
            <form onSubmit={handleVerifyAndSignUp} className="space-y-5">
              {/* Email summary badge with edit action */}
              <div className="bg-muted/70 border border-border/80 rounded-2xl p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
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
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1 shrink-0 px-2 py-1 rounded-lg hover:bg-primary/5 transition-colors"
                >
                  <Edit3 className="w-3 h-3" />
                  Edit
                </button>
              </div>

              {/* Dev Mode Notification / Helper Banner */}
              {devCode && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-center">
                  <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                    Development OTP Code: <span className="font-mono text-sm tracking-widest font-black text-amber-700 dark:text-amber-300">{devCode}</span>
                  </p>
                </div>
              )}

              {/* 6-Digit OTP Inputs */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 block text-center tracking-widest" style={{ fontFamily: "'Inter-bold', sans-serif"}}>
                  Enter 6-Digit Code*
                </label>
                <div className="flex items-center justify-center gap-2 sm:gap-2.5" onPaste={handleOtpPaste}>
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
                      className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-black rounded-xl bg-muted border ${
                        digit ? 'border-primary ring-2 ring-primary/20 bg-background text-foreground' : 'border-slate-300 text-foreground'
                      } focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono`}
                    />
                  ))}
                </div>
              </div>

              {/* Resend Code Section */}
              <div className="text-center pt-1">
                {resendCooldown > 0 ? (
                  <p className="text-xs font-bold text-muted-foreground">
                    Resend code in <span className="text-primary font-mono font-black">{Math.floor(resendCooldown / 60)}:{String(resendCooldown % 60).padStart(2, '0')}</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={isResending}
                    className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
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
                  className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg transition-all active:scale-95"
                  disabled={isLoading || otp.join('').length !== 6}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    <>Verify & Enroll</>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep('info')}
                  className="w-full h-11 rounded-xl text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                  Back to Details
                </Button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center border-t border-border pt-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Already an Aspirant? <Link href="/login" className="text-primary hover:underline">Log In</Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
