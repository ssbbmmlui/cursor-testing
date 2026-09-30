export type ScoreMessage = {
  type: 'playlab:score';
  subject: string;
  gameId: string;
  score: number;
  metadata?: unknown;
};

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isScoreMessage(value: unknown): value is ScoreMessage {
  if (!isPlainObject(value)) return false;
  return (
    value.type === 'playlab:score' &&
    typeof value.subject === 'string' &&
    typeof value.gameId === 'string' &&
    typeof value.score === 'number' &&
    Number.isFinite(value.score)
  );
}

export function cloneMetadata(value: unknown): Record<string, unknown> {
  if (!isPlainObject(value)) return {};
  try {
    const cloned: unknown = JSON.parse(JSON.stringify(value));
    return isPlainObject(cloned) ? cloned : {};
  } catch {
    return {};
  }
}
