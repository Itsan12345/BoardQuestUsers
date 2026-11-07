"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { loginAction } from '../api';

export function useLoginForm() {
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
    const result = await loginAction(formData);

    if (result.success) {
      try {
        sessionStorage.setItem('bq_just_logged_in', 'true');
        sessionStorage.removeItem('bq_daily_modal_dismissed');
      } catch (err) {
        // Safe fallback for sessionStorage
      }
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

  return {
    isLoading,
    showPassword,
    setShowPassword,
    isNavigating,
    handleNavigate,
    handleSubmit,
  };
}

