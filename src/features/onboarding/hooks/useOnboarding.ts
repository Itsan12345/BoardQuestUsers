"use client";

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { SUBJECT_AREAS } from '@/lib/game-logic';
import { saveStudyPlanAction } from '../api';
import type { TargetDatesMap } from '../types';

export function useOnboarding() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [targets, setTargets] = useState<TargetDatesMap>({});

  const handleDateSelect = useCallback((subject: string, date: Date | undefined) => {
    if (date) {
      setTargets((prev) => ({ ...prev, [subject]: date }));
    }
  }, []);

  const isComplete = useMemo(() => {
    return SUBJECT_AREAS.every((s) => targets[s]);
  }, [targets]);

  const finalizePlan = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const result = await saveStudyPlanAction(targets);
      if (result.success) {
        toast({
          title: 'Strategy Deployed',
          description: 'Your personalized study timeline is now active.',
        });
        router.push('/');
      } else {
        toast({
          variant: 'destructive',
          title: 'Sync Error',
          description: result.error,
        });
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Tactical Error',
        description: 'An unexpected error occurred during deployment.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [targets, router, toast]);

  return {
    isSubmitting,
    targets,
    isComplete,
    handleDateSelect,
    finalizePlan,
  };
}

