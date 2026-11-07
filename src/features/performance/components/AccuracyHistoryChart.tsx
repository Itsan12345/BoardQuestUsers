import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Activity, BarChart3 } from 'lucide-react';
import type { SubjectAccuracyHistoryItem } from '../types';

interface AccuracyHistoryChartProps {
  history: SubjectAccuracyHistoryItem[];
}

export function AccuracyHistoryChart({ history }: AccuracyHistoryChartProps) {
  const hasHistory = history.some((p) => p.attemptCount > 0 || p.avgAccuracy > 0);

  if (!hasHistory) {
    return (
      <div className="h-[320px] sm:h-[360px] w-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-muted-foreground">
        <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
          <BarChart3 className="w-6 h-6 text-muted-foreground/50" />
        </div>
        <div className="space-y-1 max-w-sm">
          <p className="text-sm font-bold text-foreground">No quest attempt history logged yet</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Complete chapter nodes or boss battles in Quest Arena to populate your historical discipline accuracy chart.
          </p>
        </div>
      </div>
    );
  }

  const totalRuns = history.reduce((acc, p) => acc + p.attemptCount, 0);

  return (
    <div className="space-y-4">
      <div className="h-[300px] sm:h-[340px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              className="text-border/40"
              vertical={false}
            />
            <XAxis
              dataKey="subject"
              tick={{ fill: 'currentColor', fontSize: 11, fontWeight: 500 }}
              className="text-muted-foreground"
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: 'currentColor', fontSize: 11 }}
              className="text-muted-foreground"
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-popover border border-border rounded-xl p-3 shadow-2xl text-xs space-y-1.5 min-w-[170px]">
                      <p className="font-bold text-foreground font-headline border-b border-border/50 pb-1">
                        {item.fullSubjectName || item.subject}
                      </p>
                      <div className="flex justify-between items-center text-muted-foreground">
                        <span>Average Accuracy:</span>
                        <span className="font-black text-primary font-mono text-sm">
                          {item.avgAccuracy}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-muted-foreground text-[11px]">
                        <span>Quests / Nodes:</span>
                        <span className="font-bold text-foreground">
                          {item.attemptCount} completed
                        </span>
                      </div>
                      {item.totalQuestions > 0 && (
                        <div className="flex justify-between items-center text-muted-foreground text-[11px]">
                          <span>Total Questions:</span>
                          <span className="font-bold text-foreground">
                            {item.totalQuestions} Qs
                          </span>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="avgAccuracy"
              fill="hsl(var(--primary))"
              radius={[8, 8, 0, 0]}
              maxBarSize={52}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Footer */}
      <div className="pt-3 border-t border-border/50 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-primary" />
          <span>Aggregated from all completed Chapter Quests & Mock Exams</span>
        </span>
        <span className="font-semibold text-foreground">
          Total Recorded Runs: <strong className="text-primary">{totalRuns}</strong>
        </span>
      </div>
    </div>
  );
}

