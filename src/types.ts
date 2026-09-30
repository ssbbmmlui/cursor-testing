export type LeaderboardMode = 'default' | 'tracks';

export type GameEntry = {
  id: string;
  title: string;
  titleZh?: string;
  description: string;
  descriptionZh?: string;
  subject: string;
  difficulty: string;
  estimatedTime: string;
  author?: string;
  thumbnail?: string;
  topic?: string;
  externalUrl?: string;
  leaderboard?: boolean;
  leaderboardMode?: LeaderboardMode;
  scoreLabel?: string;
  touchSafe?: boolean;
};

export type Lang = 'en' | 'zh';
