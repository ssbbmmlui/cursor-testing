import { Atom, Book, Calculator, Globe, TestTube, Trophy } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { PlatformMark } from '../components/PlatformMark';
import { QrModal } from '../components/QrModal';
import { SubjectCard } from '../components/SubjectCard';
import { PLATFORM_NAME } from '../config';
import { SUBJECTS } from '../data/subjects';
import { useLanguage } from '../i18n/LanguageContext';
import { usePageTitle } from '../lib/usePageTitle';
import { Layout } from '../components/Layout';

const floats = [
  { Icon: Calculator, className: 'left-1 top-16', delay: '0s', color: 'text-emerald-600' },
  { Icon: TestTube, className: 'right-1 top-12', delay: '0.6s', color: 'text-orange-500' },
  { Icon: Atom, className: 'right-3 bottom-14', delay: '1.1s', color: 'text-fuchsia-600' },
  { Icon: Book, className: 'left-2 bottom-12', delay: '1.6s', color: 'text-blue-600' },
  { Icon: Globe, className: 'left-[42%] top-3', delay: '0.9s', color: 'text-teal-600' },
];

const steps = [
  { key: '1', title: 'step1Title', body: 'step1Body', face: 'bg-blue-600', edge: 'shadow-[0_8px_0_0_#1d4ed8]' },
  { key: '2', title: 'step2Title', body: 'step2Body', face: 'bg-emerald-500', edge: 'shadow-[0_8px_0_0_#047857]' },
  { key: '3', title: 'step3Title', body: 'step3Body', face: 'bg-amber-500', edge: 'shadow-[0_8px_0_0_#b45309]' },
] as const;

export function HomePage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [qrOpen, setQrOpen] = useState(false);
  usePageTitle();

  return (
    <Layout>
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-6 py-10 text-white shadow-xl sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full bg-cyan-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-indigo-300/30 blur-3xl" />
        <div className="relative grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-100">{t('welcome')}</p>
            <h1 className="mt-2 text-5xl font-black tracking-tight sm:text-6xl">{PLATFORM_NAME}</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-blue-50">{t('tagline')}</p>
            <p className="mt-5 inline-flex rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold backdrop-blur">
              {t('badge')}
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => document.getElementById('subjects')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="rounded-full bg-white px-6 py-3 text-sm font-bold text-blue-700 shadow-lg hover:bg-blue-50"
              >
                {t('startPlaying')}
              </button>
            </div>
          </div>
          <div className="relative mx-auto h-80 w-full max-w-xs lg:max-w-none">
            {floats.map((item) => (
              <span
                key={item.className}
                className={`animate-bob absolute grid h-12 w-12 place-items-center rounded-2xl bg-white/95 shadow-lg ${item.className} ${item.color}`}
                style={{ animationDelay: item.delay }}
              >
                <item.Icon className="h-6 w-6" aria-hidden="true" />
              </span>
            ))}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <button
                type="button"
                onClick={() => setQrOpen(true)}
                aria-label={t('scanToPlay')}
                className="grid h-44 w-44 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-indigo-600 text-white shadow-2xl ring-8 ring-white/20 transition hover:scale-105"
              >
                <PlatformMark className="h-16 w-16" />
              </button>
            </div>
          </div>
        </div>
        <div className="relative mt-10 grid gap-3 md:grid-cols-2">
          {user ? null : (
            <p className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm leading-6 text-white backdrop-blur-md">
              {t('signInPrompt')}
            </p>
          )}
          <p className="flex items-start gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm leading-6 text-white backdrop-blur-md">
            <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
            <span>{t('trophyHint')}</span>
          </p>
        </div>
      </section>

      <section id="subjects" className="mt-10 scroll-mt-24">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {SUBJECTS.map((subject) => (
            <SubjectCard key={subject.id} subject={subject} />
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-slate-200 bg-white px-6 py-10 shadow-sm sm:px-10">
        <h2 className="text-center text-2xl font-bold text-slate-900">{t('howItWorks')}</h2>
        <ol className="mt-8 grid gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <li key={step.key} className="text-center">
              <div
                className={`mx-auto grid h-16 w-16 place-items-center rounded-2xl text-2xl font-black text-white ${step.face} ${step.edge}`}
              >
                {step.key}
              </div>
              <h3 className="mt-5 text-lg font-bold text-slate-900">{t(step.title)}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{t(step.body)}</p>
            </li>
          ))}
        </ol>
      </section>
      <QrModal open={qrOpen} onClose={() => setQrOpen(false)} />
    </Layout>
  );
}
