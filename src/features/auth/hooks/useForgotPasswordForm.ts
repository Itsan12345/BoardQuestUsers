"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { sendPasswordResetCodeAction, verifyAndResetPasswordAction } from '../api';
import type { ForgotPasswordStep } from '../types';

export function useForgotPasswordForm() {
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState<ForgotPasswordStep>('request');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

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

  // Validation rules
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isPasswordLongEnough = password.length >= 8;
  const hasPasswordNumber = /\d/.test(password);
  const hasPasswordSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isPasswordValid = isPasswordLongEnough && hasPasswordNumber && hasPasswordSpecial;
  const doPasswordsMatch = password.length > 0 && password === confirmPassword;

  const isOtpComplete = otp.every((digit) => digit.length === 1);
  const isResetFormValid = isOtpComplete && isPasswordValid && doPasswordsMatch;

  // Countdown timer for Resend Code
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
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
        variant: 'destructive',
        title: 'Invalid Email',
        description: 'Please provide a valid email address.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await sendPasswordResetCodeAction(email.trim());
      if (result.success) {
        setStep('reset');
        setResendCooldown(60);
        setOtp(['', '', '', '', '', '']);
        if (result.devCode) {
          setDevCode(result.devCode);
        }
        toast({
          title: 'Verification Code Dispatched',
          description: `A 6-digit recovery code has been sent to ${email.trim()}.`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Dispatch Failed',
          description: result.error || 'Failed to dispatch password recovery code.',
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

  // Resend recovery code handler
  async function handleResendCode() {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    try {
      const result = await sendPasswordResetCodeAction(email.trim());
      if (result.success) {
        setResendCooldown(60);
        if (result.devCode) {
          setDevCode(result.devCode);
        }
        toast({
          title: 'Code Resent',
          description: `New recovery code dispatched to ${email.trim()}.`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Resend Failed',
          description: result.error || 'Could not dispatch recovery code.',
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

  // Step 2: Finalize password reset
  async function handleVerifyAndResetPassword(e: React.FormEvent) {
    e.preventDefault();
    const fullCode = otp.join('');
    if (fullCode.length !== 6) {
      toast({
        variant: 'destructive',
        title: 'Incomplete Code',
        description: 'Please enter the complete 6-digit recovery code.',
      });
      return;
    }

    if (!isPasswordValid) {
      toast({
        variant: 'destructive',
        title: 'Password Too Weak',
        description: 'Your new password does not meet the security criteria.',
      });
      return;
    }

    if (!doPasswordsMatch) {
      toast({
        variant: 'destructive',
        title: 'Passwords Mismatch',
        description: 'The entered passwords do not match.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('email', email.trim());
      formData.append('code', fullCode);
      formData.append('password', password);

      const result = await verifyAndResetPasswordAction(formData);

      if (result.success) {
        toast({
          title: 'Password Successfully Reset',
          description: 'Your mission credentials have been updated. You can now log in.',
        });
        router.push('/login');
      } else {
        toast({
          variant: 'destructive',
          title: 'Reset Failed',
          description: result.error || 'Invalid or expired recovery code.',
        });
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred during password reset.',
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
    isPasswordValid,
    doPasswordsMatch,
    isOtpComplete,
    isResetFormValid,
    handleNavigate,
    handleSendCode,
    handleResendCode,
    handleOtpChange,
    handleOtpKeyDown,
    handleOtpPaste,
    handleVerifyAndResetPassword,
  };
}

