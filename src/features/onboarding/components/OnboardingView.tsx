"use client";

import { ChevronRight, GraduationCap, Target, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { SUBJECT_AREAS } from '@/lib/game-logic';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useOnboarding } from '../hooks';
import { FACULTY_DEADLINE } from '../constants';
import { SubjectTargetPicker } from './SubjectTargetPicker';

export function OnboardingView() {
  const {
    isSubmitting,
    targets,
    isComplete,
    handleDateSelect,
    finalizePlan,
  } = useOnboarding();

  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center p-4 py-12">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <Card className="max-w-2xl w-full border border-border shadow-2xl rounded-[2.5rem] overflow-hidden bg-card">
        <div className="h-2 bg-primary" />
        <CardHeader className="p-8 lg:p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
            <GraduationCap className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-black font-headline uppercase tracking-tight text-foreground">
            Setup Your <span className="text-primary">Study Plan</span>
          </CardTitle>
          <CardDescription className="text-base font-medium">
            Define your targets for each major laboratory science area.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 lg:p-12 pt-0 space-y-8">
          <div className="p-4 bg-slate-900 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-primary" />
              <span className="text-[10px] font-black uppercase text-white/70 tracking-widest">
                Faculty Deadline
              </span>
            </div>
            <span className="font-black text-primary text-sm uppercase">
              {format(FACULTY_DEADLINE, 'MMMM dd, yyyy')}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SUBJECT_AREAS.map((subject) => (
              <SubjectTargetPicker
                key={subject}
                subject={subject}
                date={targets[subject]}
                maxDate={FACULTY_DEADLINE}
                onSelect={(date) => handleDateSelect(subject, date)}
              />
            ))}
          </div>

          <Button
            className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-lg font-black uppercase tracking-widest shadow-xl group text-white mt-4"
            disabled={!isComplete || isSubmitting}
            onClick={finalizePlan}
          >
            {isSubmitting ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                Initiate Expedition
                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

