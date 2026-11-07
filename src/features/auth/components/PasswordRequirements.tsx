import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordRequirementsProps {
  isPasswordLongEnough: boolean;
  hasPasswordNumber: boolean;
  hasPasswordSpecial: boolean;
}

export function PasswordRequirements({
  isPasswordLongEnough,
  hasPasswordNumber,
  hasPasswordSpecial,
}: PasswordRequirementsProps) {
  return (
    <div className="space-y-1.5 bg-muted/70 p-3 rounded-xl border border-border/60 text-xs">
      <p className="font-bold text-[10px] uppercase text-muted-foreground tracking-wider mb-1">
        Password Requirements
      </p>
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'w-4 h-4 rounded-full flex items-center justify-center text-[10px]',
            isPasswordLongEnough
              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {isPasswordLongEnough ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : '•'}
        </div>
        <span
          className={cn(
            'text-[11px]',
            isPasswordLongEnough ? 'text-foreground font-semibold' : 'text-muted-foreground'
          )}
        >
          At least 8 characters
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'w-4 h-4 rounded-full flex items-center justify-center text-[10px]',
            hasPasswordNumber
              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {hasPasswordNumber ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : '•'}
        </div>
        <span
          className={cn(
            'text-[11px]',
            hasPasswordNumber ? 'text-foreground font-semibold' : 'text-muted-foreground'
          )}
        >
          At least 1 number
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'w-4 h-4 rounded-full flex items-center justify-center text-[10px]',
            hasPasswordSpecial
              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {hasPasswordSpecial ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : '•'}
        </div>
        <span
          className={cn(
            'text-[11px]',
            hasPasswordSpecial ? 'text-foreground font-semibold' : 'text-muted-foreground'
          )}
        >
          At least 1 special character (!@#$%^&*...)
        </span>
      </div>
    </div>
  );
}

