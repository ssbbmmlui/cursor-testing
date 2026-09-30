import { Crown, Medal, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { LOCAL_PLAYER_ID } from '../config';
import { useLanguage } from '../i18n/LanguageContext';
import { academicStartYear, academicYearOptions, formatAcademicYear } from '../scores/academicYear';
import { buildBoardRows, collectTrackIds, extractClassCode, type BoardRow, type Period } from '../scores/leaderboard';
import { useScores } from '../scores/scoreStore';
import type { GameEntry } from '../types';

const selectClass =
  'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700';

const difficultyMarks: Record<string, { label: string; className: string }> = {
  easy: { label: '梅', className: 'bg-green-100 text-green-700' },
  normal: { label: '竹', className: 'bg-amber-100 text-amber-800' },
  hard: { label: '松', className: 'bg-red-100 text-red-700' },
  oni: { label: '鬼', className: 'bg-purple-100 text-purple-700' },
};

export function LeaderboardPanel({ game }: { game: GameEntry }) {
  const { t } = useLanguage();
  const scores = useScores();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('year');
  const [academicYear, setAcademicYear] = useState(() => academicStartYear(new Date()));
  const [classCode, setClassCode] = useState('all');
  const [trackId, setTrackId] = useState('all');
  const [expanded, setExpanded] = useState(false);
  const mode = game.leaderboardMode === 'tracks' ? 'tracks' : 'default';
  const years = academicYearOptions();

  useEffect(() => {
    setLoading(false);
  }, []);

  const records = scores.filter((record) => record.subject === game.subject && record.gameId === game.id);
  const tracks = mode === 'tracks' ? collectTrackIds(records) : [];
  const rows = buildBoardRows({
    records,
    mode,
    period,
    academicYear,
    trackId,
    displayName: t('thisDevice'),
  });
  const classCodes = uniqueClassCodes(rows);
  const classActive = classCodes.length > 0 && classCode !== 'all';
  const filtered = classActive ? rows.filter((row) => row.classCode === classCode) : rows;
  const shown = expanded ? filtered : filtered.slice(0, 10);
  const yourBest = filtered.find((row) => row.isCurrentUser);
  const yourRank = yourBest ? filtered.findIndex((row) => row.key === yourBest.key) + 1 : 0;
  const pinYourBest = Boolean(yourBest && !shown.some((row) => row.key === yourBest.key));

  const periods: Period[] = ['year', 'all', 'month'];
  const periodLabel: Record<Period, 'thisYear' | 'allTime' | 'monthly'> = {
    year: 'thisYear',
    all: 'allTime',
    month: 'monthly',
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Trophy className="h-6 w-6 text-amber-500" aria-hidden="true" />
            {t('leaderboard')}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{t('cloudNote')}</p>
        </div>
        <div className="flex flex-wrap rounded-full bg-slate-100 p-1" role="group" aria-label={t('leaderboard')}>
          {periods.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={period === item}
              onClick={() => {
                setPeriod(item);
                setExpanded(false);
              }}
              className={
                period === item
                  ? 'rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-blue-700 shadow'
                  : 'rounded-full px-3 py-1.5 text-sm font-medium text-slate-600'
              }
            >
              {t(periodLabel[item])}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {period === 'year' ? (
          <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
            {t('academicYear')}
            <select
              className={selectClass}
              value={academicYear}
              onChange={(event) => setAcademicYear(Number(event.target.value))}
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {formatAcademicYear(year)}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {classCodes.length > 0 ? (
          <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <span className="sr-only">{t('allClasses')}</span>
            <select className={selectClass} value={classCode} onChange={(event) => setClassCode(event.target.value)}>
              <option value="all">{t('allClasses')}</option>
              {classCodes.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {mode === 'tracks' ? (
          <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
            {t('track')}
            <select className={selectClass} value={trackId} onChange={(event) => setTrackId(event.target.value)}>
              <option value="all">{t('allTracks')}</option>
              {tracks.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-slate-500">{t('loadingScores')}</p>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-slate-500">
          {classActive
            ? t('emptyClass', { class: classCode })
            : period === 'month'
              ? t('emptyMonth')
              : period === 'year'
                ? t('emptyYear')
                : t('emptyAll')}
        </p>
      ) : (
        <>
          <ol className="mt-4 divide-y divide-slate-100">
            {shown.map((row, index) => (
              <ScoreRow
                key={row.key}
                row={row}
                rank={index + 1}
                mode={mode}
                scoreLabel={game.scoreLabel}
              />
            ))}
          </ol>
          {pinYourBest && yourBest ? (
            <div className="mt-3 border-t border-dashed border-amber-200 pt-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700">{t('yourBest')}</p>
              <ScoreRow row={yourBest} rank={yourRank} mode={mode} scoreLabel={game.scoreLabel} highlighted />
            </div>
          ) : null}
          {filtered.length > 10 ? (
            <button
              type="button"
              onClick={() => setExpanded((current) => !current)}
              className="mt-4 text-sm font-semibold text-blue-700 hover:underline"
            >
              {expanded ? t('showTop') : t('viewAll', { count: filtered.length })}
            </button>
          ) : null}
        </>
      )}
    </section>
  );
}

function uniqueClassCodes(rows: BoardRow[]): string[] {
  const codes = new Set<string>();
  for (const row of rows) {
    const code = row.classCode ?? extractClassCode(row.displayName);
    if (code) codes.add(code);
  }
  return [...codes].sort();
}

function ScoreRow({
  row,
  rank,
  mode,
  scoreLabel,
  highlighted = false,
}: {
  row: BoardRow;
  rank: number;
  mode: 'default' | 'tracks';
  scoreLabel?: string;
  highlighted?: boolean;
}) {
  const scoreText = scoreLabel ? `${row.score.toLocaleString()} ${scoreLabel}` : row.score.toLocaleString();
  const name =
    row.isCurrentUser || row.userId === LOCAL_PLAYER_ID ? (
      <Link to="/profile" className="font-semibold text-slate-800 hover:text-blue-700">
        {row.displayName}
      </Link>
    ) : (
      <Link to={`/profile/${row.userId}`} className="font-semibold text-slate-800 hover:text-blue-700">
        {row.displayName}
      </Link>
    );

  return (
    <li className={`flex items-center gap-3 py-3 ${highlighted ? 'rounded-xl bg-amber-50 px-3' : ''}`}>
      <RankMark rank={rank} />
      <div className="min-w-0 flex-1">
        {name}
        {mode === 'tracks' ? <TrackMeta metadata={row.metadata} /> : null}
      </div>
      <span className="shrink-0 text-lg font-bold tabular-nums text-amber-600">{scoreText}</span>
    </li>
  );
}

function RankMark({ rank }: { rank: number }) {
  if (rank === 1) return <Medal className="h-6 w-6 shrink-0 text-amber-400" aria-label="1" />;
  if (rank === 2) return <Medal className="h-6 w-6 shrink-0 text-slate-400" aria-label="2" />;
  if (rank === 3) return <Medal className="h-6 w-6 shrink-0 text-amber-700" aria-label="3" />;
  return (
    <span className="grid h-6 w-6 shrink-0 place-items-center text-sm font-bold text-slate-500" aria-label={String(rank)}>
      {rank}
    </span>
  );
}

function TrackMeta({ metadata }: { metadata: Record<string, unknown> }) {
  const { t } = useLanguage();
  const difficulty = typeof metadata.difficulty === 'string' ? metadata.difficulty.toLowerCase() : '';
  const mark = difficultyMarks[difficulty];
  const track = typeof metadata.trackId === 'string' || typeof metadata.trackId === 'number' ? String(metadata.trackId) : '';
  const bits = [
    numberBit(t('good'), metadata.good),
    numberBit(t('ok'), metadata.ok),
    numberBit(t('bad'), metadata.bad),
    numberBit(t('maxCombo'), metadata.maxCombo),
  ].filter((bit): bit is string => Boolean(bit));

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
      {track ? <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">{track}</span> : null}
      {mark ? <span className={`rounded-full px-2 py-0.5 font-semibold ${mark.className}`}>{mark.label}</span> : null}
      <CrownMark value={metadata.crown} />
      {bits.length > 0 ? <span>{bits.join(' · ')}</span> : null}
    </div>
  );
}

function numberBit(label: string, value: unknown): string | null {
  return typeof value === 'number' && Number.isFinite(value) ? `${label} ${value}` : null;
}

function CrownMark({ value }: { value: unknown }) {
  if (value === 'rainbow') {
    return (
      <span
        title="rainbow"
        className="inline-flex items-center rounded-full bg-gradient-to-r from-red-400 via-amber-300 to-sky-500 p-0.5"
      >
        <Crown className="h-3.5 w-3.5 text-white" aria-label="rainbow" />
      </span>
    );
  }
  if (value === 'gold') return <Crown className="h-4 w-4 text-amber-500" aria-label="gold" />;
  if (value === 'silver') return <Crown className="h-4 w-4 text-slate-400" aria-label="silver" />;
  return null;
}
