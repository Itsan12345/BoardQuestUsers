import { MapPin, Settings, LogOut } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getRankTitle, getLevelProgress } from '@/lib/badge-system';
import type { UserProfile } from '../types';

interface ProfileHeaderCardProps {
  userProfile: UserProfile;
  onOpenSettings: () => void;
  onLogout: () => void;
}

export function ProfileHeaderCard({
  userProfile,
  onOpenSettings,
  onLogout,
}: ProfileHeaderCardProps) {
  const initialsFromName = userProfile.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const progress = getLevelProgress(userProfile.xp);

  return (
    <Card
      id="tour-profile-card"
      className="border border-border shadow-xl rounded-2xl sm:rounded-3xl bg-background overflow-hidden"
    >
      <CardContent className="p-4 sm:p-5 xl:p-8">
        <div className="flex flex-col gap-6 sm:gap-8 w-full">
          <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-start md:items-center justify-between">
            {/* Avatar and Info */}
            <div className="flex items-center gap-4 sm:gap-6 w-full md:w-auto">
              <Avatar className="h-16 w-16 sm:h-24 sm:w-24 border-4 border-primary/20 shrink-0">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary text-primary-foreground text-xl sm:text-2xl font-semibold">
                  {initialsFromName}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-2 sm:space-y-3 min-w-0 flex-1">
                <div>
                  <h1 className="text-xl sm:text-3xl font-semibold text-foreground truncate">
                    {userProfile.name}
                  </h1>
                  <p className="text-muted-foreground text-xs sm:text-sm flex items-center gap-1 mt-0.5 sm:mt-1">
                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> {userProfile.location}
                  </p>
                </div>

                <div className="flex gap-1.5 sm:gap-2 flex-wrap mt-1">
                  <Badge className="bg-primary text-primary-foreground font-semibold text-[10px] sm:text-xs px-2.5 sm:px-3 py-0.5 sm:py-1">
                    LVL {userProfile.level} {getRankTitle(userProfile.level).toUpperCase()}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-primary/40 text-primary font-semibold text-[10px] sm:text-xs px-2.5 sm:px-3 py-0.5 sm:py-1"
                  >
                    {userProfile.classString}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 sm:gap-3 w-full md:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenSettings}
                className="flex-1 md:flex-none rounded-xl border-primary/50 text-primary hover:bg-primary/10 hover:text-primary hover:border-primary/80 font-semibold text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4 transition-colors"
              >
                <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" /> Account Settings
              </Button>
              <Button
                size="sm"
                className="flex-1 md:flex-none rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4"
                onClick={onLogout}
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" /> Logout
              </Button>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="flex flex-col gap-1 w-full mt-1 sm:mt-2">
            <div className="flex justify-between items-end px-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                XP Progress
              </span>
              <span className="text-[10px] font-bold text-primary">
                {progress.currentLevelXp}{' '}
                <span className="text-muted-foreground">/ {progress.xpForNextLevel}</span>
              </span>
            </div>
            <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden border border-border/60 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

