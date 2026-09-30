export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Local calendar day. Do not use toISOString, which shifts the day in UTC. */
export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export type HeatCell = {
  date: Date;
  key: string;
  count: number;
  inRange: boolean;
};

export function buildHeatmap(timestamps: string[], now = new Date()): { weeks: HeatCell[][]; daysPlayed: number } {
  const today = startOfLocalDay(now);
  const from = new Date(today);
  from.setFullYear(from.getFullYear() - 1);
  from.setDate(from.getDate() + 1);

  const counts = new Map<string, number>();
  for (const timestamp of timestamps) {
    const parsed = new Date(timestamp);
    if (Number.isNaN(parsed.getTime())) continue;
    const day = startOfLocalDay(parsed);
    if (day < from || day > today) continue;
    const key = localDateKey(day);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const gridStart = new Date(from);
  const weekday = gridStart.getDay();
  const daysSinceMonday = weekday === 0 ? 6 : weekday - 1;
  gridStart.setDate(gridStart.getDate() - daysSinceMonday);

  const weeks: HeatCell[][] = [];
  const cursor = new Date(gridStart);
  while (cursor <= today) {
    const week: HeatCell[] = [];
    for (let index = 0; index < 7; index += 1) {
      const key = localDateKey(cursor);
      const inRange = cursor >= from && cursor <= today;
      week.push({
        date: new Date(cursor),
        key,
        count: inRange ? (counts.get(key) ?? 0) : 0,
        inRange,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  return { weeks, daysPlayed: counts.size };
}

export function heatClass(count: number): string {
  if (count <= 0) return 'bg-slate-200';
  if (count === 1) return 'bg-green-200';
  if (count <= 3) return 'bg-green-400';
  if (count <= 6) return 'bg-green-600';
  return 'bg-green-800';
}
