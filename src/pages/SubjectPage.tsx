import { FolderOpen, SearchX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { EmptyState } from '../components/EmptyState';
import { GameCard } from '../components/GameCard';
import { Layout } from '../components/Layout';
import { getSubject, subjectName } from '../data/subjects';
import { filterGames } from '../games/filter';
import { useGames } from '../games/GameContext';
import { useLanguage } from '../i18n/LanguageContext';
import { usePageTitle } from '../lib/usePageTitle';

const selectClass = 'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700';

export function SubjectPage() {
  const { subject: subjectId = '' } = useParams();
  const { lang, t } = useLanguage();
  const { getGamesBySubject, getTopics, getGrades } = useGames();
  const subject = getSubject(subjectId);
  const name = subject ? subjectName(subject, lang) : subjectId;
  const games = getGamesBySubject(subjectId);
  const topics = getTopics(subjectId);
  const grades = getGrades(subjectId);
  const [topic, setTopic] = useState('all');
  const [grade, setGrade] = useState('all');

  useEffect(() => {
    setTopic('all');
    setGrade('all');
  }, [subjectId]);

  const filtered = filterGames(games, topic, grade);
  usePageTitle(t('gamesTitle', { subject: name }));

  return (
    <Layout>
      <header>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">{t('gamesTitle', { subject: name })}</h1>
        <p className="mt-2 text-slate-500">{t('gamesSubtitle', { subject: name })}</p>
      </header>

      {games.length > 0 ? (
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:flex-wrap lg:items-center">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            {t('topic')}
            <select className={selectClass} value={topic} onChange={(event) => setTopic(event.target.value)}>
              <option value="all">{t('all')}</option>
              {topics.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            {t('form')}
            <select className={selectClass} value={grade} onChange={(event) => setGrade(event.target.value)}>
              <option value="all">{t('all')}</option>
              {grades.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => {
              setTopic('all');
              setGrade('all');
            }}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            {t('clearFilters')}
          </button>
          <p className="text-sm text-slate-500 lg:ml-auto">
            {t('showing', { count: filtered.length, total: games.length })}
          </p>
        </div>
      ) : null}

      {games.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={FolderOpen}
            title={t('noGames')}
            body={<p>{t('devHint', { path: `games/${subjectId}/` })}</p>}
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-8">
          <EmptyState icon={SearchX} title={t('noMatch')} body={<p>{t('noMatchHint')}</p>} />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </Layout>
  );
}
