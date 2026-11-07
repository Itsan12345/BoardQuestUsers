import { format } from 'date-fns';
import { Zap, Mail, Calendar as CalendarIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { UserProfile } from '../types';

interface AspirantStatsCardProps {
  userProfile: UserProfile;
}

export function AspirantStatsCard({ userProfile }: AspirantStatsCardProps) {
  return (
    <Card className="border border-border shadow-lg rounded-2xl">
      <CardHeader className="pb-3 p-4 sm:p-6 sm:pb-3">
        <CardTitle className="text-base sm:text-lg font-semibold text-foreground">
          Aspirant Stats
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
        <div className="flex items-center justify-between p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
          <div className="flex items-center gap-2 min-w-0">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="font-semibold text-xs sm:text-sm text-foreground truncate">
              {userProfile.streak} {userProfile.streak === 1 ? 'Day' : 'Days'} Streak
            </span>
          </div>
          <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-400 font-semibold text-[10px] shrink-0">
            +20% XP
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
            <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
            <span
              className="text-foreground/80 font-medium truncate"
              title={userProfile.email}
            >
              {userProfile.email}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
            <span className="text-foreground/80 font-medium">
              Joined {format(new Date(userProfile.createdAt), 'MMMM yyy')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

