"use client";

import { 
  FlaskConical, 
  Microscope, 
  Droplet, 
  Dna, 
  Eye, 
  FileText, 
  CheckCircle2, 
  Zap, 
  BookOpen, 
  Award,
  ChevronRight
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export interface SubjectMasteryItem {
  subject: string;
  shortName: string;
  radarLabel: string;
  completion: number;
  mastery: number;
  status: string;
  points?: number;
}

interface SubjectTechnicalBreakdownProps {
  items: SubjectMasteryItem[];
  onSelectSubject?: (subjectName: string) => void;
}

const SUBJECT_ICONS: Record<string, any> = {
  "Clinical Chemistry": FlaskConical,
  "Microbiology": Microscope,
  "Hematology": Droplet,
  "Immunology & Serology and Immunohematology": Dna,
  "Clinical Microscopy & Parasitology": Eye,
  "Histopathology & MT Laws": FileText,
  "Histopathology and Medtech Laws": FileText,
};

export function SubjectTechnicalBreakdown({ items, onSelectSubject }: SubjectTechnicalBreakdownProps) {
  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-border/60 pb-3">
        <div>
          <h3 className="text-lg sm:text-xl font-bold font-headline text-foreground flex items-center gap-2 uppercase tracking-tight">
            <BookOpen className="w-5 h-5 text-primary shrink-0" />
            Subject Technical Breakdown
          </h3>
          <p className="text-xs text-muted-foreground font-medium">
            Discipline points, syllabus completion, and quest mastery parameters.
          </p>
        </div>
        <Badge variant="outline" className="text-[10px] font-bold border-primary/30 text-primary uppercase shrink-0">
          {items.length} {items.length === 1 ? 'Licensure Discipline' : 'Licensure Disciplines'}
        </Badge>
      </div>

      {/* Discipline Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
        {items.map((item) => {
          const IconComponent = SUBJECT_ICONS[item.subject] || FlaskConical;
          const isMastered = item.status === "Mastered";
          const estimatedPoints = item.points ?? Math.round(item.mastery * 10 + item.completion * 5);

          return (
            <Card
              key={item.subject}
              onClick={() => onSelectSubject?.(item.subject)}
              className="group relative overflow-hidden p-4 sm:p-5 border border-border shadow-md rounded-2xl bg-card hover:border-primary/50 transition-all duration-200 cursor-pointer space-y-4"
            >
              {/* Top Row: Icon, Subject Title & Status Badge */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2.5 rounded-xl shrink-0 transition-colors ${
                    isMastered ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary'
                  }`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm sm:text-base text-foreground font-headline truncate leading-tight group-hover:text-primary transition-colors">
                      {item.subject}
                    </h4>
                    <span className="text-[10.5px] text-muted-foreground font-semibold flex items-center gap-1 mt-0.5">
                      Points: <strong className="text-primary font-mono text-xs">{estimatedPoints} Pts</strong>
                    </span>
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className={`text-[9.5px] font-extrabold uppercase px-2 py-0.5 rounded-lg shrink-0 ${
                    item.status === 'Mastered' || item.mastery >= 90
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                      : item.status === 'Proficient' || item.mastery >= 75
                      ? 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                      : item.status === 'In Training' || item.mastery >= 50
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                      : 'bg-muted text-muted-foreground border-border'
                  }`}
                >
                  {item.status || (item.mastery >= 90 ? 'Mastered' : item.mastery >= 75 ? 'Proficient' : item.mastery >= 50 ? 'In Training' : 'Needs Focus')}
                </Badge>
              </div>

              {/* Progress Bars Section */}
              <div className="space-y-3 pt-1 border-t border-border/40">
                {/* 1. Completion Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10.5px] font-semibold">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-blue-500" />
                      Syllabus Completion
                    </span>
                    <span className="font-bold text-foreground font-mono">{item.completion}%</span>
                  </div>
                  <Progress value={item.completion} className="h-1.5 rounded-full bg-muted" />
                </div>

                {/* 2. Mastery Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10.5px] font-semibold">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-500" />
                      Subject Proficiency
                    </span>
                    <span className="font-bold text-primary font-mono">{item.mastery}%</span>
                  </div>
                  <Progress value={item.mastery} className="h-1.5 rounded-full bg-muted" />
                </div>
              </div>

              {/* Card Footer Link */}
              <div className="pt-2 flex items-center justify-between text-[11px] font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                <span>View Discipline Modules</span>
                <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
