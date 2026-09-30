import { Link, useLocation, useParams } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { PLATFORM_NAME } from '../config';
import { gameTitle } from '../data/catalog';
import { getSubject, subjectName } from '../data/subjects';
import { useGames } from '../games/GameContext';
import { useLanguage } from '../i18n/LanguageContext';
import { PlatformMark } from './PlatformMark';
import { UserMenu } from './UserMenu';

type Crumb = { label: string; to: string };

export function Header() {
  const { t, lang, toggleLang } = useLanguage();
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const { getGame } = useGames();
  const { pathname } = useLocation();
  const params = useParams();
  const crumbs = buildCrumbs(pathname, params.subject, params.gameId, t, lang, getGame);

  return (
    <header className="sticky top-0 z-40 border-b-4 border-blue-600 bg-white shadow-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 md:h-20">
        <Link to="/" className="flex shrink-0 items-center gap-2 text-slate-900">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white">
            <PlatformMark />
          </span>
          <span className="text-xl font-extrabold tracking-tight">{PLATFORM_NAME}</span>
        </Link>
        <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
          <nav aria-label="Breadcrumb" className="hidden min-w-0 md:block">
            <ol className="flex min-w-0 items-center gap-2 text-sm text-slate-500">
              {crumbs.map((crumb, index) => {
                const last = index === crumbs.length - 1;
                return (
                  <li key={`${crumb.to}-${index}`} className="flex min-w-0 items-center gap-2">
                    {index > 0 ? <span aria-hidden="true">/</span> : null}
                    {last ? (
                      <span className="max-w-[16rem] truncate font-bold text-blue-600">{crumb.label}</span>
                    ) : (
                      <Link to={crumb.to} className="max-w-[10rem] truncate hover:text-blue-600">
                        {crumb.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
          <button
            type="button"
            onClick={toggleLang}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            aria-label={lang === 'en' ? t('switchToZh') : t('switchToEn')}
          >
            {lang === 'en' ? '中文' : 'EN'}
          </button>
          {user ? (
            <UserMenu user={user} onSignOut={signOut} />
          ) : loading ? null : (
            <button
              type="button"
              onClick={signInWithGoogle}
              className="rounded-full bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 sm:px-4"
            >
              {t('signIn')}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function buildCrumbs(
  pathname: string,
  subjectId: string | undefined,
  gameId: string | undefined,
  t: (key: 'home' | 'profile') => string,
  lang: 'en' | 'zh',
  getGame: (subject: string, id: string) => ReturnType<ReturnType<typeof useGames>['getGame']>,
): Crumb[] {
  const home: Crumb = { label: t('home'), to: '/' };
  if (pathname === '/') return [home];

  if (subjectId && pathname.startsWith('/subject/')) {
    const subject = getSubject(subjectId);
    return [home, { label: subject ? subjectName(subject, lang) : subjectId, to: `/subject/${subjectId}` }];
  }

  if (subjectId && gameId && pathname.startsWith('/game/')) {
    const subject = getSubject(subjectId);
    const game = getGame(subjectId, gameId);
    return [
      home,
      { label: subject ? subjectName(subject, lang) : subjectId, to: `/subject/${subjectId}` },
      { label: game ? gameTitle(game, lang) : gameId, to: pathname },
    ];
  }

  if (pathname === '/profile' || pathname.startsWith('/profile/')) {
    return [home, { label: t('profile'), to: pathname }];
  }

  return [home];
}
