import type { GameEntry } from '../types';

export function uniqueSorted(values: Array<string | undefined>): string[] {
  const unique = new Set(values.filter((value): value is string => Boolean(value)));
  return [...unique].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
}

export function filterGames(games: GameEntry[], topic: string, grade: string): GameEntry[] {
  return games.filter((game) => {
    const topicMatches = topic === 'all' || game.topic === topic;
    const gradeMatches = grade === 'all' || game.difficulty === grade;
    return topicMatches && gradeMatches;
  });
}
