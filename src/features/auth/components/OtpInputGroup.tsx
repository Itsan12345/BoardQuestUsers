import React from 'react';
import { cn } from '@/lib/utils';

interface OtpInputGroupProps {
  otp: string[];
  otpInputsRef: React.MutableRefObject<(HTMLInputElement | null)[]>;
  onChange: (index: number, value: string) => void;
  onKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
}

export function OtpInputGroup({
  otp,
  otpInputsRef,
  onChange,
  onKeyDown,
  onPaste,
}: OtpInputGroupProps) {
  return (
    <div className="flex items-center justify-between gap-1.5 sm:gap-2">
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
          onChange={(e) => onChange(index, e.target.value)}
          onKeyDown={(e) => onKeyDown(index, e)}
          onPaste={onPaste}
          className={cn(
            'w-11 h-14 sm:w-12 sm:h-14 text-center text-xl font-black rounded-xl border transition-all outline-none',
            'bg-muted/80 text-foreground font-mono focus:bg-background',
            digit
              ? 'border-primary text-primary shadow-sm'
              : 'border-slate-300 dark:border-slate-700',
            'focus:ring-2 focus:ring-primary/20 focus:border-primary'
          )}
        />
      ))}
    </div>
  );
}

