import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import type { RadarDataPoint } from '../types';

interface ProficiencyRadarChartProps {
  data: RadarDataPoint[];
}

export function ProficiencyRadarChart({ data }: ProficiencyRadarChartProps) {
  return (
    <div className="h-[340px] sm:h-[400px] w-full flex items-center justify-center relative z-10 select-none">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius={115} data={data}>
          <PolarGrid
            stroke="currentColor"
            strokeWidth={1}
            className="text-muted-foreground/25"
          />
          <PolarAngleAxis
            dataKey="subject"
            tick={{
              fill: 'currentColor',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "'Poppins', sans-serif",
            }}
            className="text-muted-foreground"
            tickLine={false}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={false}
            axisLine={{ stroke: 'currentColor', strokeWidth: 1 }}
            className="text-muted-foreground/20"
          />
          <Radar
            name="Mastery"
            dataKey="mastery"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.45}
            isAnimationActive={true}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

