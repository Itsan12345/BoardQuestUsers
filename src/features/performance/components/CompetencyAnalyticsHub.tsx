import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Activity, BarChart3 } from 'lucide-react';
import { ProficiencyRadarChart } from './ProficiencyRadarChart';
import { AccuracyHistoryChart } from './AccuracyHistoryChart';
import type { RadarDataPoint, SubjectAccuracyHistoryItem } from '../types';

interface CompetencyAnalyticsHubProps {
  radarData: RadarDataPoint[];
  performanceHistory: SubjectAccuracyHistoryItem[];
}

export function CompetencyAnalyticsHub({
  radarData,
  performanceHistory,
}: CompetencyAnalyticsHubProps) {
  return (
    <Card className="border border-border shadow-xl rounded-2xl sm:rounded-3xl overflow-hidden bg-background">
      <Tabs defaultValue="radar" className="w-full">
        <CardHeader className="bg-muted/30 border-b border-border p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-lg sm:text-xl font-bold font-headline text-foreground flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Competency Analytics
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Multidimensional skill mapping and quest accuracy history.
            </CardDescription>
          </div>

          <TabsList className="bg-muted p-1 rounded-xl shrink-0 self-start sm:self-auto">
            <TabsTrigger
              value="radar"
              className="text-xs font-bold rounded-lg px-3 py-1.5 flex items-center gap-1.5"
            >
              <Activity className="w-3.5 h-3.5" />
              Proficiency Radar
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="text-xs font-bold rounded-lg px-3 py-1.5 flex items-center gap-1.5"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Accuracy History
            </TabsTrigger>
          </TabsList>
        </CardHeader>

        {/* Tab 1: Radar Chart */}
        <TabsContent
          value="radar"
          className="p-4 sm:p-8 m-0 relative overflow-hidden select-none"
        >
          <ProficiencyRadarChart data={radarData} />
        </TabsContent>

        {/* Tab 2: Quest Accuracy History Bar Chart */}
        <TabsContent value="history" className="p-4 sm:p-8 m-0">
          <AccuracyHistoryChart history={performanceHistory} />
        </TabsContent>
      </Tabs>
    </Card>
  );
}

