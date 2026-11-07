import { format } from 'date-fns';
import { Clock, Award } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { UserAchievement } from '../types';

interface RecentAchievementsCardProps {
  achievements: UserAchievement[];
}

export function RecentAchievementsCard({ achievements }: RecentAchievementsCardProps) {
  return (
    <Card className="border border-border shadow-lg rounded-2xl">
      <CardHeader className="pb-3 p-4 sm:p-6 sm:pb-3">
        <CardTitle className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" /> Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
        <div className="space-y-2.5 sm:space-y-3">
          {achievements && achievements.length > 0 ? (
            achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="flex items-center justify-between p-2.5 sm:p-3 border border-border rounded-lg hover:bg-muted transition gap-2"
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-secondary rounded-lg flex items-center justify-center shrink-0">
                    <Award className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-xs sm:text-sm text-foreground truncate">
                      {achievement.task}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                      {format(new Date(achievement.timestamp), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-primary text-xs sm:text-sm shrink-0">
                  +{achievement.xp} XP
                </span>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-6 sm:py-8 text-xs sm:text-sm">
              No activities yet. Start questing!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

