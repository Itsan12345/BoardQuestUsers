
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar as CalendarIcon, ChevronRight, GraduationCap, Target, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { SUBJECT_AREAS } from '@/lib/game-logic';
import { saveStudyPlan } from '@/app/actions/study-plan';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

const FACULTY_DEADLINE = new Date(2025, 5, 30); // June 30, 2025

interface SubjectPickerProps {
  subject: string;
  date: Date | undefined;
  onSelect: (date: Date | undefined) => void;
}

function SubjectTargetPicker({ subject, date, onSelect }: SubjectPickerProps) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="space-y-2">
      <label className="text-xs font-black text-muted-foreground uppercase tracking-wider">{subject}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className={cn(
            "flex w-full items-center justify-start text-left font-normal rounded-xl h-12 border-2 px-3 transition-all outline-none",
            !date && "text-muted-foreground border-border hover:border-primary/30",
            date && "border-primary/20 bg-primary/5 text-primary"
          )}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span className="text-sm font-bold">
              {mounted && date ? format(date, "PPP") : "Set Target Date"}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(newDate) => {
              onSelect(newDate);
              setOpen(false);
            }}
            disabled={(date) => {
              const today = startOfDay(new Date());
              return date < today || date > FACULTY_DEADLINE;
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default function Onboarding() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [targets, setTargets] = useState<Record<string, Date>>({});

  const handleDateSelect = (subject: string, date: Date | undefined) => {
    if (date) {
      setTargets(prev => ({ ...prev, [subject]: date }));
    }
  };

  const isComplete = SUBJECT_AREAS.every(s => targets[s]);

  const finalizePlan = async () => {
    setIsSubmitting(true);
    try {
      const result = await saveStudyPlan(targets);
      if (result.success) {
        toast({
          title: "Strategy Deployed",
          description: "Your personalized study timeline is now active.",
        });
        router.push('/');
      } else {
        toast({
          variant: "destructive",
          title: "Sync Error",
          description: result.error,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Tactical Error",
        description: "An unexpected error occurred during deployment.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <span className="text-[10px] font-black uppercase text-white/70 tracking-widest">Faculty Deadline</span>
            </div>
            <span className="font-black text-primary text-sm uppercase">{format(FACULTY_DEADLINE, "MMMM dd, yyyy")}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SUBJECT_AREAS.map((subject) => (
              <SubjectTargetPicker
                key={subject}
                subject={subject}
                date={targets[subject]}
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
