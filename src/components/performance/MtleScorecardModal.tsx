"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MtleReadinessResult, MtleSubjectScore } from '@/lib/mtle-predictor-engine';

export interface MtleScorecardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: MtleReadinessResult | null;
  userName?: string;
}

export function MtleScorecardModal({ open, onOpenChange, data, userName = "MedTech Candidate" }: MtleScorecardModalProps) {
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>MTLE Performance Scorecard</DialogTitle>
          <DialogDescription>
            Candidate: {userName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Overall Status</span>
            <Badge variant="outline">
              {data?.prcStatus || "In Progress"}
            </Badge>
          </div>

          {data?.subjects && data.subjects.length > 0 && (
            <div className="space-y-2">
              <p className="font-medium text-xs text-muted-foreground uppercase">Subject Breakdown</p>
              {data.subjects.map((s: MtleSubjectScore) => (
                <div key={s.subject} className="flex justify-between items-center text-xs">
                  <span>{s.subject}</span>
                  <span className="font-bold">{s.score}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
