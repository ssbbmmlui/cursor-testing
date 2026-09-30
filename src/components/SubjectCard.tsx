import { Link } from 'react-router';
import { subjectDescription, subjectName, type Subject } from '../data/subjects';
import { useLanguage } from '../i18n/LanguageContext';

export function SubjectCard({ subject }: { subject: Subject }) {
  const { lang, t } = useLanguage();
  const Icon = subject.icon;

  return (
    <Link
      to={`/subject/${subject.id}`}
      className="group relative flex h-full flex-col items-center overflow-hidden rounded-2xl border border-slate-200 bg-white px-5 pb-6 pt-8 text-center shadow-sm transition duration-300 hover:[transform:translateY(-0.25rem)_scale(1.02)] hover:shadow-lg"
    >
      <span
        className={`relative grid h-[72px] w-[72px] place-items-center rounded-2xl text-white shadow-lg ${subject.iconClass}`}
      >
        <span className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/45 to-transparent" />
        <Icon className="relative h-8 w-8" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-lg font-bold text-slate-900">{subjectName(subject, lang)}</h2>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">{subjectDescription(subject, lang)}</p>
      <span className="mt-4 h-5 text-sm font-semibold text-blue-600 opacity-0 transition group-hover:opacity-100">
        {t('exploreGames')}
      </span>
      <span
        className={`absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-gradient-to-r transition duration-300 group-hover:scale-x-100 ${subject.lineClass}`}
      />
    </Link>
  );
}
