const HONG_KONG = 'Asia/Hong_Kong';

/** First academic year offered in the year dropdown. */
export const FIRST_ACADEMIC_START = 2025;

export type YearMonthDay = {
  year: number;
  month: number;
  day: number;
};

export function hongKongDate(date: Date): YearMonthDay {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: HONG_KONG,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? '0');
  return { year: read('year'), month: read('month'), day: read('day') };
}

function stamp(value: YearMonthDay): number {
  return value.year * 10000 + value.month * 100 + value.day;
}

/** Academic year runs from 1 September through 31 August in Hong Kong. */
export function academicStartYear(date: Date): number {
  const current = hongKongDate(date);
  return current.month >= 9 ? current.year : current.year - 1;
}

export function academicYearOptions(now = new Date()): number[] {
  const latest = Math.max(academicStartYear(now), FIRST_ACADEMIC_START);
  const years: number[] = [];
  for (let year = FIRST_ACADEMIC_START; year <= latest; year += 1) years.push(year);
  return years;
}

export function formatAcademicYear(startYear: number): string {
  return `${startYear}–${startYear + 1}`;
}

export function isInAcademicYear(iso: string, startYear: number): boolean {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  const value = stamp(hongKongDate(date));
  return value >= startYear * 10000 + 901 && value <= (startYear + 1) * 10000 + 831;
}

export function isInLocalMonth(iso: string, now = new Date()): boolean {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}
