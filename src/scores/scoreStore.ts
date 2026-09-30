import { useSyncExternalStore } from 'react';
import { SCORE_CHANGE_EVENT, SCORE_STORAGE_KEY } from '../config';
import { dedupeKey } from './dedupe';
import { cloneMetadata, isPlainObject } from './messages';

export type ScoreRecord = {
  id: string;
  subject: string;
  gameId: string;
  score: number;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type NewScore = {
  subject: string;
  gameId: string;
  score: number;
  metadata?: Record<string, unknown>;
};

const EMPTY: ScoreRecord[] = [];

let snapshot: ScoreRecord[] = EMPTY;
let snapshotRaw: string | null | undefined;

function normalize(value: unknown): ScoreRecord | null {
  if (!isPlainObject(value)) return null;
  if (typeof value.id !== 'string' || typeof value.subject !== 'string' || typeof value.gameId !== 'string') {
    return null;
  }
  if (typeof value.score !== 'number' || !Number.isFinite(value.score) || value.score <= 0) return null;
  if (typeof value.createdAt !== 'string') return null;
  return {
    id: value.id,
    subject: value.subject,
    gameId: value.gameId,
    score: value.score,
    metadata: isPlainObject(value.metadata) ? value.metadata : {},
    createdAt: value.createdAt,
  };
}

function readRaw(): string | null {
  try {
    return localStorage.getItem(SCORE_STORAGE_KEY);
  } catch {
    return null;
  }
}

function parseRaw(raw: string | null): ScoreRecord[] {
  if (!raw) return EMPTY;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    const records = parsed.map(normalize).filter((record): record is ScoreRecord => record !== null);
    return records.length > 0 ? records : EMPTY;
  } catch {
    return EMPTY;
  }
}

export function getScoreSnapshot(): ScoreRecord[] {
  const raw = readRaw();
  if (raw === snapshotRaw) return snapshot;
  snapshotRaw = raw;
  snapshot = parseRaw(raw);
  return snapshot;
}

function emit() {
  window.dispatchEvent(new Event(SCORE_CHANGE_EVENT));
}

export function subscribeScores(onStoreChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === SCORE_STORAGE_KEY || event.key === null) onStoreChange();
  };
  window.addEventListener(SCORE_CHANGE_EVENT, onStoreChange);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(SCORE_CHANGE_EVENT, onStoreChange);
    window.removeEventListener('storage', onStorage);
  };
}

export function useScores(): ScoreRecord[] {
  return useSyncExternalStore(subscribeScores, getScoreSnapshot, () => EMPTY);
}

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `score-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function bestScore(records: ScoreRecord[], subject: string, gameId: string, key: string): number {
  return records.reduce((best, record) => {
    if (record.subject !== subject || record.gameId !== gameId) return best;
    if (dedupeKey(record.metadata) !== key) return best;
    return Math.max(best, record.score);
  }, 0);
}

/**
 * Single write path for scores.
 * Phase 2 replaces the localStorage append inside this function with a database insert.
 * Callers keep the same arguments and the same dedupe rule.
 */
export function recordScore(input: NewScore): ScoreRecord | null {
  if (typeof input.score !== 'number' || !Number.isFinite(input.score) || input.score <= 0) return null;

  const metadata = cloneMetadata(input.metadata);
  const key = dedupeKey(metadata);
  const existing = getScoreSnapshot();
  if (input.score <= bestScore(existing, input.subject, input.gameId, key)) return null;

  const record: ScoreRecord = {
    id: createId(),
    subject: input.subject,
    gameId: input.gameId,
    score: input.score,
    metadata,
    createdAt: new Date().toISOString(),
  };
  const next = existing.length === 0 ? [record] : [...existing, record];

  try {
    const raw = JSON.stringify(next);
    localStorage.setItem(SCORE_STORAGE_KEY, raw);
    snapshotRaw = raw;
    snapshot = next;
    emit();
  } catch {
    return null;
  }

  return record;
}
