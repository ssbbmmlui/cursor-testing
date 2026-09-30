import type { GameEntry, Lang } from '../types';

/**
 * Register future games here.
 * A game is a static file at public/games/{subject}/{gameId}/index.html
 * plus one object in this list. Do not add learning games in phase 1.
 */
const LEARNING_GAMES: GameEntry[] = [];

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
