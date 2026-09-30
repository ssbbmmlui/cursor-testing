import { LOCAL_PLAYER_ID } from '../config';
import type { LeaderboardMode } from '../types';
import { isInAcademicYear, isInLocalMonth } from './academicYear';
import { dedupeKey, trackIdOf } from './dedupe';
import type { ScoreRecord } from './scoreStore';

export type Period = 'year' | 'all' | 'month';

export type BoardRow = {
  key: string;
  userId: string;
  displayName: string;
  score: number;
  createdAt: string;
  metadata: Record<string, unknown>;
  isCurrentUser: boolean;
  classCode: string | null;
};

export function extractClassCode(displayName: string): string | null {
  const match = displayName.match(/\b([1-6][A-Z])\b/);
  return match?.[1] ?? null;
}

function inPeriod(iso: string, period: Period, academicYear: number, now: Date): boolean {
  if (period === 'all') return true;
  if (period === 'month') return isInLocalMonth(iso, now);
  return isInAcademicYear(iso, academicYear);
}

export function collectTrackIds(records: ScoreRecord[]): string[] {
  const ids = new Set<string>();
  for (const record of records) {
    const trackId = trackIdOf(record.metadata);
    if (trackId) ids.add(trackId);
  }
  return [...ids].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

type Group = {
  score: number;
  createdAt: string;
  metadata: Record<string, unknown>;
  dedupe: string;
};

/**
 * Phase 1 folds every saved score into this device.
 * Phase 2 can group the same rows by account without changing the board layout.
 */
export function buildBoardRows(options: {
  records: ScoreRecord[];
  mode: LeaderboardMode;
  period: Period;
  academicYear: number;
  trackId: string;
  displayName: string;
  now?: Date;
}): BoardRow[] {
  const now = options.now ?? new Date();
  const groups = new Map<string, Group>();

  for (const record of options.records) {
    if (!inPeriod(record.createdAt, options.period, options.academicYear, now)) continue;
    if (options.mode === 'tracks' && options.trackId !== 'all') {
      if (trackIdOf(record.metadata) !== options.trackId) continue;
    }

    const dedupe = options.mode === 'tracks' ? dedupeKey(record.metadata) : '__player__';
    const groupKey = `${LOCAL_PLAYER_ID}::${dedupe}`;
    const current = groups.get(groupKey);
    const better =
      !current ||
      record.score > current.score ||
      (record.score === current.score && record.createdAt < current.createdAt);
    if (!better) continue;
    groups.set(groupKey, {
      score: record.score,
      createdAt: record.createdAt,
      metadata: record.metadata,
      dedupe,
    });
  }

  const classCode = extractClassCode(options.displayName);
  const rows: BoardRow[] = [...groups.values()].map((group) => ({
    key: `${LOCAL_PLAYER_ID}:${group.dedupe}`,
    userId: LOCAL_PLAYER_ID,
    displayName: options.displayName,
    score: group.score,
    createdAt: group.createdAt,
    metadata: group.metadata,
    isCurrentUser: true,
    classCode,
  }));

  rows.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.createdAt < b.createdAt) return -1;
    if (a.createdAt > b.createdAt) return 1;
    return 0;
  });
  return rows;
}
