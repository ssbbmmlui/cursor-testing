/** Same key keeps only a strictly higher score. Missing track uses the default key. */
export function dedupeKey(metadata: Record<string, unknown> | undefined): string {
  if (!metadata) return '__default__';
  const trackId = metadata.trackId;
  const hasTrack =
    (typeof trackId === 'string' && trackId.length > 0) ||
    (typeof trackId === 'number' && Number.isFinite(trackId));
  if (!hasTrack) return '__default__';
  const difficulty = metadata.difficulty == null ? '' : String(metadata.difficulty);
  return `${String(trackId)}::${difficulty}`;
}

export function trackIdOf(metadata: Record<string, unknown> | undefined): string | null {
  if (!metadata) return null;
  const trackId = metadata.trackId;
  if (typeof trackId === 'string' && trackId.length > 0) return trackId;
  if (typeof trackId === 'number' && Number.isFinite(trackId)) return String(trackId);
  return null;
}
