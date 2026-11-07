export interface LeaderboardUser {
  id: string;
  name: string;
  level: number;
  xp: number;
  streak?: number;
  [key: string]: any;
}

export interface RankTier {
  id?: string;
  rankId?: string;
  title?: string;
  name?: string;
  minLevel?: number;
  maxLevel?: number | null;
  description?: string;
  color?: string;
  icon?: string;
}

export interface LeaderboardResponse {
  topUsers: LeaderboardUser[];
  totalUsers: number;
  currentUserRank: number | null;
}

