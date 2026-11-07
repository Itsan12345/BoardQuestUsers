"use client";

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
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { TermsAndConditionsModal } from '@/components/auth/TermsAndConditionsModal';
import { useSignupForm } from '../hooks';
import { AuthLayout } from './AuthLayout';
import { cn } from '@/lib/utils';

export function SignupForm() {
  const {
    step,
    setStep,
    isLoading,
    isResending,
    isNavigating,
    name,
    setName,
    email,
    setEmail,
    isEmailFocused,
    setIsEmailFocused,
    password,
    setPassword,
    isPasswordFocused,
    setIsPasswordFocused,
    showPassword,
    setShowPassword,
    hasAgreedToTerms,
    setHasAgreedToTerms,
    isTermsModalOpen,
    setIsTermsModalOpen,
    termsActiveTab,
    termsError,
    setTermsError,
    otp,
    otpInputsRef,
    resendCooldown,
    devCode,
    isEmailValid,
    hasNoSpacesEmail,
    isPasswordLongEnough,
    hasPasswordNumber,
    hasPasswordSpecial,
    handleNavigate,
    handleOpenTerms,
    handleAcceptTerms,
    handleSendCode,
    handleResendCode,
    handleOtpChange,
    handleOtpKeyDown,
    handleOtpPaste,
    handleVerifyAndSignUp,
  } = useSignupForm();

  return (
    <AuthLayout>
      <Card
        className={cn(
          'relative z-10 max-w-md w-full border border-border shadow-2xl rounded-[2.5rem] overflow-visible bg-card transform-gpu',
          isNavigating
            ? 'opacity-0 scale-[0.97] -translate-y-2 transition-all duration-200 ease-in'
            : 'animate-in fade-in-0 zoom-in-[0.98] slide-in-from-bottom-2 duration-300 ease-out'
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
            ASPIRANT{' '}
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
            <form
              onSubmit={handleSendCode}
              className="space-y-3 animate-in fade-in-0 zoom-in-[0.99] duration-250 ease-out"
            >
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
                  EMAIL ADDRESS*
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
                    <div className="absolute bottom-[calc(100%+0.5rem)] left-0 right-0 lg:bottom-auto lg:left-auto lg:right-[calc(100%+0.85rem)] lg:top-1/2 lg:-translate-y-1/2 lg:w-64 bg-card text-card-foreground rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.18)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.6)] p-3.5 border border-border z-50 animate-in fade-in-0 zoom-in-95 duration-150">
                      <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-card border-r border-t border-border rotate-45 rounded-tr-sm" />
                      <div className="block lg:hidden absolute -bottom-1.5 left-6 w-3 h-3 bg-card border-r border-b border-border rotate-45" />

                      <div className="space-y-2 relative z-10">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`rounded-full p-0.5 flex-shrink-0 transition-colors ${
                              isEmailValid
                                ? 'bg-[#851315] text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-muted-foreground'
                            }`}
                          >
                            <Check className="w-3 h-3" strokeWidth={4} />
                          </div>
                          <span className="text-xs font-bold text-foreground">
                            Must contain valid email address.
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`rounded-full p-0.5 flex-shrink-0 transition-colors ${
                              hasNoSpacesEmail
                                ? 'bg-[#851315] text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-muted-foreground'
                            }`}
                          >
                            <Check className="w-3 h-3" strokeWidth={4} />
                          </div>
                          <span className="text-xs font-bold text-foreground">
                            No spaces allowed.
                          </span>
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
                    type={showPassword ? 'text' : 'password'}
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
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>

                  {/* Password Validation Popover */}
                  {isPasswordFocused && (
                    <div className="absolute bottom-[calc(100%+0.5rem)] left-0 right-0 lg:bottom-auto lg:left-auto lg:right-[calc(100%+0.85rem)] lg:top-1/2 lg:-translate-y-1/2 lg:w-64 bg-card text-card-foreground rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.18)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.6)] p-3.5 border border-border z-50 animate-in fade-in-0 zoom-in-95 duration-150">
                      <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-card border-r border-t border-border rotate-45 rounded-tr-sm" />
                      <div className="block lg:hidden absolute -bottom-1.5 left-6 w-3 h-3 bg-card border-r border-b border-border rotate-45" />

                      <div className="space-y-2 relative z-10">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`rounded-full p-0.5 flex-shrink-0 transition-colors ${
                              isPasswordLongEnough
                                ? 'bg-[#851315] text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-muted-foreground'
                            }`}
                          >
                            <Check className="w-3 h-3" strokeWidth={4} />
                          </div>
                          <span className="text-xs font-bold text-foreground">
                            At least 8 characters.
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`rounded-full p-0.5 flex-shrink-0 transition-colors ${
                              hasPasswordNumber
                                ? 'bg-[#851315] text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-muted-foreground'
                            }`}
                          >
                            <Check className="w-3 h-3" strokeWidth={4} />
                          </div>
                          <span className="text-xs font-bold text-foreground">
                            Contains a number.
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`rounded-full p-0.5 flex-shrink-0 transition-colors ${
                              hasPasswordSpecial
                                ? 'bg-[#851315] text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-muted-foreground'
                            }`}
                          >
                            <Check className="w-3 h-3" strokeWidth={4} />
                          </div>
                          <span className="text-xs font-bold text-foreground">
                            Contains a special character.
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Terms and Conditions Agreement */}
              <div className="flex items-center gap-2.5 pt-1 px-1 select-none">
                <Checkbox
                  id="terms-checkbox"
                  checked={hasAgreedToTerms}
                  onCheckedChange={(checked) => {
                    setHasAgreedToTerms(checked === true);
                    if (checked) setTermsError(false);
                  }}
                  className={cn(
                    'h-4 w-4 rounded-none border-slate-400 dark:border-slate-500 data-[state=checked]:bg-[#851315] dark:data-[state=checked]:bg-[#dc2626] data-[state=checked]:border-transparent transition-all shrink-0',
                    termsError && 'border-red-500 ring-2 ring-red-500/30'
                  )}
                />
                <div className="text-[11px] leading-snug">
                  <label
                    htmlFor="terms-checkbox"
                    className="text-foreground/90 font-medium cursor-pointer block"
                  >
                    I agree to the{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        handleOpenTerms('terms');
                      }}
                      className="font-bold text-[#851315] dark:text-[#dc2626] hover:underline"
                    >
                      Terms & Conditions
                    </button>
                    {', '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        handleOpenTerms('aup');
                      }}
                      className="font-bold text-[#851315] dark:text-[#dc2626] hover:underline"
                    >
                      AUP
                    </button>
                    {', and '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        handleOpenTerms('privacy');
                      }}
                      className="font-bold text-[#851315] dark:text-[#dc2626] hover:underline"
                    >
                      Privacy Notice
                    </button>
                    .
                  </label>
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
            <form
              onSubmit={handleVerifyAndSignUp}
              className="space-y-4 animate-in fade-in-0 zoom-in-[0.99] duration-250 ease-out"
            >
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
                    <p className="text-xs font-bold text-foreground truncate">{email}</p>
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
                    Development OTP Code:{' '}
                    <span className="font-mono text-sm tracking-widest font-black text-amber-700 dark:text-amber-300">
                      {devCode}
                    </span>
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
                    Resend code in{' '}
                    <span className="text-[#851315] dark:text-[#dc2626] font-mono font-black">
                      {Math.floor(resendCooldown / 60)}:
                      {String(resendCooldown % 60).padStart(2, '0')}
                    </span>
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
              ALREADY AN ASPIRANT?{' '}
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

      {/* Institutional Terms & Governance Modal */}
      <TermsAndConditionsModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        onAccept={handleAcceptTerms}
        defaultTab={termsActiveTab}
      />
    </AuthLayout>
  );
}

