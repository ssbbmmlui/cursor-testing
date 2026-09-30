import { ChevronLeft, CircleOff, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { Link, useParams } from 'react-router';
import { EmptyState } from '../components/EmptyState';
import { Layout } from '../components/Layout';
import { LeaderboardPanel } from '../components/LeaderboardPanel';
import { gameDescription, gameTitle } from '../data/catalog';
import { getSubject, subjectName } from '../data/subjects';
import { useGames } from '../games/GameContext';
import { useLanguage } from '../i18n/LanguageContext';
import { deviceNeedsPseudoFullscreen, requestElementFullscreen } from '../lib/fullscreen';
import { appBasePath } from '../lib/site';
import { usePageTitle } from '../lib/usePageTitle';
import { cloneMetadata, isScoreMessage } from '../scores/messages';
import { recordScore } from '../scores/scoreStore';
import type { GameEntry } from '../types';

export function GamePage() {
  const { subject: subjectId = '', gameId = '' } = useParams();
  const { getGame } = useGames();
  const game = getGame(subjectId, gameId);
  if (!game) return <MissingGame subjectId={subjectId} gameId={gameId} />;
  return <GamePlayer game={game} />;
}

function MissingGame({ subjectId, gameId }: { subjectId: string; gameId: string }) {
  const { lang, t } = useLanguage();
  const subject = getSubject(subjectId);
  const name = subject ? subjectName(subject, lang) : subjectId;
  usePageTitle(gameId);

  return (
    <Layout>
      <EmptyState
        icon={CircleOff}
        title={t('gameNotFound')}
        body={
          <div className="space-y-4">
            <p>{t('gameNotFoundHint')}</p>
            <Link to={`/subject/${subjectId}`} className="inline-flex font-semibold text-blue-700 hover:underline">
              {t('backTo', { subject: name })}
            </Link>
          </div>
        }
      />
    </Layout>
  );
}

function GamePlayer({ game }: { game: GameEntry }) {
  const { lang, t } = useLanguage();
  const subject = getSubject(game.subject);
  const subjectLabel = subject ? subjectName(subject, lang) : game.subject;
  const title = gameTitle(game, lang);
  const description = gameDescription(game, lang);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const fullscreen = useFullscreen(iframeRef, frameRef, !game.externalUrl);
  usePageTitle(title);

  return (
    <Layout>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link
          to={`/subject/${game.subject}`}
          className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:underline"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {t('backTo', { subject: subjectLabel })}
        </Link>
        {game.externalUrl || fullscreen.pseudo ? null : (
          <button
            type="button"
            onClick={() => void fullscreen.toggle()}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            {fullscreen.active ? (
              <Minimize2 className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Maximize2 className="h-4 w-4" aria-hidden="true" />
            )}
            {fullscreen.active ? t('exitFullscreen') : t('fullscreen')}
          </button>
        )}
      </div>

      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">{title}</h1>
        <p className="mt-3 max-w-3xl leading-7 text-slate-600">{description}</p>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Meta label={t('subject')} value={subjectLabel} />
          <Meta label={t('difficulty')} value={game.difficulty} />
          <Meta label={t('estimatedTime')} value={game.estimatedTime} />
          {game.author ? <Meta label={t('author')} value={game.author} /> : null}
        </dl>
      </article>

      {game.externalUrl ? (
        <ExternalGame url={game.externalUrl} />
      ) : (
        <GameFrame
          game={game}
          title={title}
          iframeRef={iframeRef}
          frameRef={frameRef}
          pseudo={fullscreen.pseudo}
          onExit={() => void fullscreen.exit()}
        />
      )}

      {game.leaderboard ? (
        <div className="mt-6">
          <LeaderboardPanel game={game} />
        </div>
      ) : null}
    </Layout>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <dt className="text-xs font-semibold text-slate-400">{label}</dt>
      <dd className="mt-1 font-semibold text-slate-800">{value}</dd>
    </div>
  );
}

function ExternalGame({ url }: { url: string }) {
  const { t } = useLanguage();

  useEffect(() => {
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [url]);

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
      <p className="text-slate-600">{t('opensInNewTabBody')}</p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
      >
        {t('openGame')}
      </a>
    </section>
  );
}

function GameFrame({
  game,
  title,
  iframeRef,
  frameRef,
  pseudo,
  onExit,
}: {
  game: GameEntry;
  title: string;
  iframeRef: RefObject<HTMLIFrameElement>;
  frameRef: RefObject<HTMLDivElement>;
  pseudo: boolean;
  onExit: () => void;
}) {
  const { t } = useLanguage();
  const [loaded, setLoaded] = useState(false);
  const src = `${appBasePath()}games/${encodeURIComponent(game.subject)}/${encodeURIComponent(game.id)}/index.html`;
  const touchStyle: CSSProperties | undefined = game.touchSafe
    ? { touchAction: 'manipulation', overscrollBehavior: 'none' }
    : undefined;

  useEffect(() => {
    setLoaded(false);
  }, [src]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (!isScoreMessage(event.data)) return;
      if (event.data.subject !== game.subject || event.data.gameId !== game.id) return;
      recordScore({
        subject: event.data.subject,
        gameId: event.data.gameId,
        score: event.data.score,
        metadata: cloneMetadata(event.data.metadata),
      });
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [game.subject, game.id, iframeRef]);

  useEffect(() => {
    const iframe = iframeRef.current;
    return () => {
      iframe?.contentWindow?.postMessage({ type: 'playlab:requestScore' }, window.location.origin);
    };
  }, [game.subject, game.id, iframeRef]);

  return (
    <div
      ref={frameRef}
      className={
        pseudo
          ? 'fixed inset-0 z-50 bg-black'
          : 'relative mx-auto mt-6 w-full max-w-[1100px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm'
      }
      style={pseudo ? undefined : { height: 'min(750px, 100dvh)' }}
    >
      {!loaded ? (
        <div className="absolute inset-0 z-10 grid place-items-center bg-white">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" aria-hidden="true" />
            <p>{t('loadingGame')}</p>
          </div>
        </div>
      ) : null}
      <iframe
        ref={iframeRef}
        src={src}
        title={title}
        sandbox="allow-scripts allow-same-origin allow-forms allow-downloads"
        allowFullScreen
        allow="fullscreen"
        onLoad={() => setLoaded(true)}
        style={pseudo ? { width: '100dvw', height: '100dvh', ...touchStyle } : touchStyle}
        className={pseudo ? 'block border-0 bg-black' : 'block h-full w-full border-0 bg-white'}
      />
      {pseudo ? (
        <button
          type="button"
          onClick={onExit}
          className="absolute right-4 top-4 z-20 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg"
        >
          {t('exitFullscreen')}
        </button>
      ) : null}
    </div>
  );
}

function useFullscreen(
  iframeRef: RefObject<HTMLIFrameElement>,
  frameRef: RefObject<HTMLDivElement>,
  enabled: boolean,
) {
  const [pseudo, setPseudo] = useState(false);
  const [nativeOn, setNativeOn] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const onChange = () => {
      const active = document.fullscreenElement;
      setNativeOn(Boolean(active) && (active === iframeRef.current || active === frameRef.current));
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, [enabled, iframeRef, frameRef]);

  useEffect(() => {
    if (!pseudo) return;
    const previousBody = document.body.style.overflow;
    const previousRoot = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPseudo(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousBody;
      document.documentElement.style.overflow = previousRoot;
      window.removeEventListener('keydown', onKey);
    };
  }, [pseudo]);

  const enter = async () => {
    if (deviceNeedsPseudoFullscreen()) {
      setPseudo(true);
      return;
    }
    const iframe = iframeRef.current;
    const frame = frameRef.current;
    if (iframe && (await requestElementFullscreen(iframe))) return;
    if (frame && (await requestElementFullscreen(frame))) return;
    setPseudo(true);
  };

  const exit = async () => {
    setPseudo(false);
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        setNativeOn(false);
      }
    }
  };

  return {
    pseudo,
    active: pseudo || nativeOn,
    toggle: () => (pseudo || nativeOn ? exit() : enter()),
    exit,
  };
}
