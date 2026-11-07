"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { sendVerificationCodeAction, verifyEmailAndSignUpAction } from '../api';
import type { TermsTab } from '@/components/auth/TermsAndConditionsModal';
import type { SignupStep } from '../types';

export function useSignupForm() {
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState<SignupStep>('info');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isEmailFocused, setIsEmailFocused] = useState(false);

  const [password, setPassword] = useState('');
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Terms agreement state
  const [hasAgreedToTerms, setHasAgreedToTerms] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [termsActiveTab, setTermsActiveTab] = useState<TermsTab>('terms');
  const [termsError, setTermsError] = useState(false);

  // 6-digit OTP code state
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [devCode, setDevCode] = useState<string | null>(null);

  function handleNavigate(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    e.preventDefault();
    if (isNavigating) return;
    setIsNavigating(true);
    setTimeout(() => {
      router.push(href);
    }, 180);
  }

  function handleOpenTerms(tab: TermsTab = 'terms') {
    setTermsActiveTab(tab);
    setIsTermsModalOpen(true);
  }

  function handleAcceptTerms() {
    setHasAgreedToTerms(true);
    setTermsError(false);
  }

  // Validation rules
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const hasNoSpacesEmail = email.length > 0 && !/\s/.test(email);

  const isPasswordLongEnough = password.length >= 8;
  const hasPasswordNumber = /\d/.test(password);
  const hasPasswordSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isPasswordValid = isPasswordLongEnough && hasPasswordNumber && hasPasswordSpecial;

  const isInfoFormValid =
    name.trim().length > 0 &&
    isEmailValid &&
    hasNoSpacesEmail &&
    isPasswordValid &&
    hasAgreedToTerms;

  // Countdown timer for Resend Code
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
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

    if (!hasAgreedToTerms) {
      setTermsError(true);
      toast({
        variant: 'destructive',
        title: 'Agreement Required',
        description:
          'Please review and accept the Terms & Conditions and Acceptable Use Policy before proceeding.',
      });
      return;
    }

    if (!isInfoFormValid) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fulfill all required fields and criteria before proceeding.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await sendVerificationCodeAction(email, name);

      if (result.success) {
        setStep('verify');
        setResendCooldown(60);
        setOtp(['', '', '', '', '', '']);
        if (result.devCode) {
          setDevCode(result.devCode);
        }
        toast({
          title: 'Verification Code Sent',
          description: `A 6-digit code has been dispatched to ${email}.`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Verification Failed',
          description: result.error || 'Failed to dispatch verification code.',
        });
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
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
      const result = await sendVerificationCodeAction(email, name);
      if (result.success) {
        setResendCooldown(60);
        if (result.devCode) {
          setDevCode(result.devCode);
        }
        toast({
          title: 'Code Resent',
          description: `New verification code sent to ${email}.`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Resend Failed',
          description: result.error || 'Could not resend code.',
        });
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to resend code. Please try again.',
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

    const singleDigit = cleanValue[cleanValue.length - 1];
    const newOtp = [...otp];
    newOtp[index] = singleDigit;
    setOtp(newOtp);

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

    const nextFocusIndex = Math.min(pastedData.length, 5);
    otpInputsRef.current[nextFocusIndex]?.focus();
  }

  // Step 2: Finalize verification and create user
  async function handleVerifyAndSignUp(e: React.FormEvent) {
    e.preventDefault();
    const fullCode = otp.join('');
    if (fullCode.length !== 6) {
      toast({
        variant: 'destructive',
        title: 'Incomplete Code',
        description: 'Please enter the complete 6-digit verification code.',
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

      const result = await verifyEmailAndSignUpAction(formData);

      if (result.success) {
        try {
          sessionStorage.setItem('bq_just_logged_in', 'true');
          sessionStorage.removeItem('bq_daily_modal_dismissed');
          localStorage.removeItem('bq_pref_target_exam_date');
          localStorage.removeItem('bq_pref_target_batch');
          localStorage.removeItem('bq_pref_school');
          localStorage.setItem('bq_pref_focus_subject', 'none');
          localStorage.removeItem('bq_read_notifications');
        } catch (err) {
          // Safe fallback for web storage
        }
        toast({
          title: 'Account Verified & Created',
          description: 'Welcome to BoardQuest! Expedition initialized.',
        });
        router.push('/');
        router.refresh();
      } else {
        toast({
          variant: 'destructive',
          title: 'Verification Failed',
          description: result.error || 'Invalid verification code.',
        });
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred during signup.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return {
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
    isPasswordValid,
    isInfoFormValid,
    handleNavigate,
    handleOpenTerms,
    handleAcceptTerms,
    handleSendCode,
    handleResendCode,
    handleOtpChange,
    handleOtpKeyDown,
    handleOtpPaste,
    handleVerifyAndSignUp,
  };
}

