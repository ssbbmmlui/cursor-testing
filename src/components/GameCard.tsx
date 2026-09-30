import { Clock, ExternalLink, Play, Trophy, User } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { gameDescription, gameTitle } from '../data/catalog';
import { useLanguage } from '../i18n/LanguageContext';
import type { GameEntry } from '../types';

export function GameCard({ game }: { game: GameEntry }) {
  const { lang, t } = useLanguage();
  const [imageFailed, setImageFailed] = useState(false);
  const title = gameTitle(game, lang);
  const description = gameDescription(game, lang);
  const showImage = Boolean(game.thumbnail) && !imageFailed;
  const className =
    'group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg';

  const media = (
    <div className="relative aspect-video bg-gradient-to-br from-blue-50 to-indigo-100">
      {showImage ? (
        <img
          src={game.thumbnail}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="grid h-full place-items-center gap-2 text-blue-700">
          <Play className="h-10 w-10" aria-hidden="true" />
          <span className="text-sm font-semibold">{t('clickToPlay')}</span>
        </div>
      )}
      <div className="absolute inset-0 grid place-items-center bg-slate-900/45 opacity-0 transition group-hover:opacity-100">
        <Play className="h-14 w-14 fill-white text-white" aria-hidden="true" />
      </div>
      {game.externalUrl ? (
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow">
          {t('external')}
        </span>
      ) : null}
      {game.leaderboard ? (
        <span className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white shadow">
          <Trophy className="h-4 w-4 text-amber-500" aria-hidden="true" />
        </span>
      ) : null}
    </div>
  );

  const body = (
    <div className="flex flex-1 flex-col p-4">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">{description}</p>
      {game.externalUrl ? <p className="mt-2 text-xs font-medium text-slate-400">{t('opensNewTab')}</p> : null}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        {game.topic ? (
          <span className="rounded-full bg-blue-50 px-2 py-1 font-medium text-blue-700">{game.topic}</span>
        ) : null}
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          {game.estimatedTime}
        </span>
        <span>{game.difficulty}</span>
        {game.author ? (
          <span className="inline-flex items-center gap-1">
            <User className="h-3.5 w-3.5" aria-hidden="true" />
            {game.author}
          </span>
        ) : null}
      </div>
    </div>
  );

  if (game.externalUrl) {
    return (
      <a href={game.externalUrl} target="_blank" rel="noopener noreferrer" className={className}>
        {media}
        {body}
        <span className="sr-only">
          <ExternalLink className="h-4 w-4" />
        </span>
      </a>
    );
  }

  return (
    <Link to={`/game/${game.subject}/${game.id}`} className={className}>
      {media}
      {body}
    </Link>
  );
}
