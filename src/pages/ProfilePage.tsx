import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ActivityHeatmap } from '../components/ActivityHeatmap';
import { EmptyState } from '../components/EmptyState';
import { Layout } from '../components/Layout';
import { gameTitle } from '../data/catalog';
import { getSubject, subjectName } from '../data/subjects';
import { useGames } from '../games/GameContext';
import { useLanguage } from '../i18n/LanguageContext';
import { usePageTitle } from '../lib/usePageTitle';
import { buildHeatmap } from '../scores/dates';
import { useScores, type ScoreRecord } from '../scores/scoreStore';
import { Gamepad2 } from 'lucide-react';

const PAGE_SIZE = 10;

export function ProfilePage() {
  const { lang, t } = useLanguage();
  const { getGame } = useGames();
  const scores = useScores();
  const [page, setPage] = useState(0);
  const deviceLabel = t('thisDevice');
  const letter = Array.from(deviceLabel)[0] ?? '?';
  usePageTitle(t('profile'));

  const played = useMemo(
    () =>
      scores
        .filter((record) => record.score > 0)
        .slice()
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [scores],
  );
  const pageCount = Math.max(1, Math.ceil(played.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const visible = played.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const { daysPlayed } = buildHeatmap(played.map((record) => record.createdAt));

  return (
    <Layout>
      <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-blue-600 text-2xl font-bold text-white">
            {letter}
          </span>
          <div>
            <h1 className="text-2xl font-black text-slate-900">{t('profile')}</h1>
            <p className="text-slate-500">{deviceLabel}</p>
          </div>
        </div>
        {played.length > 0 ? (
          <div className="mt-6">
            <p className="mb-3 text-sm text-slate-600">{t('daysPlayed', { count: daysPlayed })}</p>
            <ActivityHeatmap timestamps={played.map((record) => record.createdAt)} />
          </div>
        ) : null}
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-bold text-slate-900">{t('recentGames')}</h2>
        {played.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={Gamepad2}
              title={t('noGamesPlayed')}
              body={
                <Link
                  to="/"
                  className="mt-4 inline-flex rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  {t('browseGames')}
                </Link>
              }
            />
          </div>
        ) : (
          <>
            <ol className="mt-4 space-y-3">
              {visible.map((record) => (
                <ScoreItem key={record.id} record={record} lang={lang} getGame={getGame} />
              ))}
            </ol>
            {played.length > PAGE_SIZE ? (
              <div className="mt-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={safePage === 0}
                  onClick={() => setPage(safePage - 1)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40"
                >
                  {t('previous')}
                </button>
                <p className="text-sm text-slate-500">{t('pageOf', { count: safePage + 1, total: pageCount })}</p>
                <button
                  type="button"
                  disabled={safePage >= pageCount - 1}
                  onClick={() => setPage(safePage + 1)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40"
                >
                  {t('next')}
                </button>
              </div>
            ) : null}
          </>
        )}
      </section>
    </Layout>
  );
}

function ScoreItem({
  record,
  lang,
  getGame,
}: {
  record: ScoreRecord;
  lang: 'en' | 'zh';
  getGame: (subject: string, gameId: string) => ReturnType<ReturnType<typeof useGames>['getGame']>;
}) {
  const game = getGame(record.subject, record.gameId);
  const subject = getSubject(record.subject);
  const title = game ? gameTitle(game, lang) : record.gameId;
  const subjectLabel = subject ? subjectName(subject, lang) : record.subject;
  const when = new Date(record.createdAt).toLocaleString(lang === 'zh' ? 'zh-Hant' : 'en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <li className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="min-w-0 flex-1">
        <Link to={`/game/${record.subject}/${record.gameId}`} className="font-semibold text-blue-700 hover:underline">
          {title}
        </Link>
        <p className="mt-1 text-sm text-slate-500">
          {subjectLabel}
          <span aria-hidden="true"> · </span>
          <time dateTime={record.createdAt}>{when}</time>
        </p>
      </div>
      <span className="shrink-0 text-lg font-bold tabular-nums text-amber-600">{record.score.toLocaleString()}</span>
    </li>
  );
}
