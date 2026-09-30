import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { CATALOG } from '../data/catalog';
import type { GameEntry } from '../types';
import { uniqueSorted } from './filter';

type GameContextValue = {
  games: GameEntry[];
  getAllGames: () => GameEntry[];
  getGamesBySubject: (subject: string) => GameEntry[];
  getGame: (subject: string, gameId: string) => GameEntry | undefined;
  getTopics: (subject: string) => string[];
  getGrades: (subject: string) => string[];
};

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const value = useMemo<GameContextValue>(() => {
    const games = CATALOG;
    return {
      games,
      getAllGames: () => games,
      getGamesBySubject: (subject) => games.filter((game) => game.subject === subject),
      getGame: (subject, gameId) => games.find((game) => game.subject === subject && game.id === gameId),
      getTopics: (subject) => uniqueSorted(games.filter((game) => game.subject === subject).map((game) => game.topic)),
      getGrades: (subject) =>
        uniqueSorted(games.filter((game) => game.subject === subject).map((game) => game.difficulty)),
    };
  }, []);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGames(): GameContextValue {
  const value = useContext(GameContext);
  if (!value) throw new Error('useGames must be used within GameProvider');
  return value;
}
