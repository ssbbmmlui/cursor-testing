import type { GameEntry, Lang } from '../types';

/**
 * Register each learning game here.
 * A game is a static file at public/games/{subject}/{gameId}/index.html
 * plus one object in this list.
 */
const LEARNING_GAMES: GameEntry[] = [
  {
    id: 'math-snake',
    title: 'Math Snake',
    titleZh: '數學貪食蛇',
    description:
      'Steer the snake to the bubble that equals the answer. Practice addition, subtraction, multiplication, and multi-step arithmetic with positive and negative numbers.',
    descriptionZh: '控制蛇吃下等於答案的氣泡，練習正負數的加法、減法、乘法與多步運算。',
    subject: 'mathematics',
    difficulty: 'S1',
    estimatedTime: '5 min',
    author: 'PlayLab',
    topic: 'Integers',
    leaderboard: true,
    leaderboardMode: 'tracks',
    touchSafe: true,
  },
];

/** Placeholder used only to verify the player frame and the score message. */
const SCORE_CHECK: GameEntry = {
  id: 'score-check',
  title: 'Score check',
  titleZh: '分數測試',
  description: 'Placeholder page for checking the score message.',
  descriptionZh: '用來確認分數訊息的佔位頁面。',
  subject: 'tools',
  difficulty: 'S1',
  estimatedTime: '1 min',
  author: 'PlayLab',
  topic: 'Check',
  leaderboard: true,
};

export const CATALOG: GameEntry[] = [...LEARNING_GAMES, SCORE_CHECK];

export function gameTitle(game: GameEntry, lang: Lang): string {
  if (lang === 'zh' && game.titleZh) return game.titleZh;
  return game.title;
}

export function gameDescription(game: GameEntry, lang: Lang): string {
  if (lang === 'zh' && game.descriptionZh) return game.descriptionZh;
  return game.description;
}
