"use client";

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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useForgotPasswordForm } from '../hooks';
import { AuthLayout } from './AuthLayout';
import { cn } from '@/lib/utils';

export function ForgotPasswordForm() {
  const {
    step,
    setStep,
    isLoading,
    isResending,
    isNavigating,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    isPasswordFocused,
    setIsPasswordFocused,
    otp,
    otpInputsRef,
    resendCooldown,
    devCode,
    isEmailValid,
    isPasswordLongEnough,
    hasPasswordNumber,
    hasPasswordSpecial,
    doPasswordsMatch,
    isResetFormValid,
    handleNavigate,
    handleSendCode,
    handleResendCode,
    handleOtpChange,
    handleOtpKeyDown,
    handleOtpPaste,
    handleVerifyAndResetPassword,
  } = useForgotPasswordForm();

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

          <h1
            className="text-2xl font-bold tracking-tight text-foreground"
            style={{ fontFamily: "'Akira Expanded', sans-serif" }}
          >
            BOARDQUEST
          </h1>

          <CardTitle
            className="text-xl font-black uppercase tracking-widest text-foreground"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Password{' '}
            <span
              className="text-primary tracking-tight"
              style={{ fontFamily: "'Inter-bold', sans-serif" }}
            >
              Recovery
            </span>
          </CardTitle>

          <CardDescription
            className="text-xs font-bold uppercase text-muted-foreground"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
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
            <form
              onSubmit={handleSendCode}
              className="space-y-5 animate-in fade-in-0 zoom-in-[0.99] duration-250 ease-out"
            >
              <div className="space-y-2">
                <label
                  className="text-[10px] font-black uppercase text-muted-foreground ml-1"
                  style={{ fontFamily: "'Inter-bold', sans-serif" }}
                >
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                  onClick={(e) => handleNavigate(e, '/login')}
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
            <form
              onSubmit={handleVerifyAndResetPassword}
              className="space-y-5 animate-in fade-in-0 zoom-in-[0.99] duration-250 ease-out"
            >
              {/* Recipient Email Chip */}
              <div className="p-3 bg-muted/60 border border-border/80 rounded-2xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider leading-tight">
                      Code Sent To
                    </p>
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
                    🛠️ <strong>Dev Mode Code:</strong>{' '}
                    <span className="font-mono tracking-widest font-black">{devCode}</span>
                  </p>
                </div>
              )}

              {/* 6-Digit OTP Box Grid */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label
                    className="text-[10px] font-black uppercase text-muted-foreground"
                    style={{ fontFamily: "'Inter-bold', sans-serif" }}
                  >
                    6-Digit Recovery Code
                  </label>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0 || isResending}
                    className={cn(
                      'text-[10px] font-bold uppercase flex items-center gap-1 transition-colors',
                      resendCooldown > 0 || isResending
                        ? 'text-muted-foreground cursor-not-allowed opacity-70'
                        : 'text-primary hover:underline'
                    )}
                  >
                    <RefreshCw className={cn('w-3 h-3', isResending && 'animate-spin')} />
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                  </button>
                </div>

                <div className="grid grid-cols-6 gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        otpInputsRef.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      className={cn(
                        'w-full h-12 sm:h-14 text-center text-xl sm:text-2xl font-black font-mono rounded-xl border-2 transition-all outline-none bg-background',
                        digit
                          ? 'border-primary text-primary bg-primary/5 shadow-xs'
                          : 'border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground'
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label
                  className="text-[10px] font-black uppercase text-muted-foreground ml-1"
                  style={{ fontFamily: "'Inter-bold', sans-serif" }}
                >
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                      <div
                        className={cn(
                          'flex items-center gap-1.5',
                          isPasswordLongEnough
                            ? 'text-emerald-600 font-bold'
                            : 'text-muted-foreground'
                        )}
                      >
                        <Check
                          className={cn(
                            'w-3.5 h-3.5',
                            isPasswordLongEnough ? 'opacity-100' : 'opacity-30'
                          )}
                        />
                        <span>At least 8 characters long</span>
                      </div>
                      <div
                        className={cn(
                          'flex items-center gap-1.5',
                          hasPasswordNumber
                            ? 'text-emerald-600 font-bold'
                            : 'text-muted-foreground'
                        )}
                      >
                        <Check
                          className={cn(
                            'w-3.5 h-3.5',
                            hasPasswordNumber ? 'opacity-100' : 'opacity-30'
                          )}
                        />
                        <span>Contains at least 1 number</span>
                      </div>
                      <div
                        className={cn(
                          'flex items-center gap-1.5',
                          hasPasswordSpecial
                            ? 'text-emerald-600 font-bold'
                            : 'text-muted-foreground'
                        )}
                      >
                        <Check
                          className={cn(
                            'w-3.5 h-3.5',
                            hasPasswordSpecial ? 'opacity-100' : 'opacity-30'
                          )}
                        />
                        <span>Contains 1 special character (!@#$%^&*)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label
                  className="text-[10px] font-black uppercase text-muted-foreground ml-1"
                  style={{ fontFamily: "'Inter-bold', sans-serif" }}
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className={cn(
                      'pl-10 pr-10 h-12 bg-muted border rounded-xl focus-visible:ring-primary/20 text-sm font-medium transition-all',
                      confirmPassword.length > 0
                        ? doPasswordsMatch
                          ? 'border-emerald-500 bg-emerald-50/10'
                          : 'border-red-400 bg-red-50/10'
                        : 'border-slate-300'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-slate-600 focus:outline-none transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {confirmPassword.length > 0 && !doPasswordsMatch && (
                  <p className="text-[10px] font-bold text-red-600 ml-1">
                    Passwords do not match.
                  </p>
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
              <Link
                href="/login"
                onClick={(e) => handleNavigate(e, '/login')}
                className="text-primary hover:underline font-black"
              >
                Log In
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

