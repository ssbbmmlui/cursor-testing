import { Link } from 'react-router';
import { Layout } from '../components/Layout';
import { useLanguage } from '../i18n/LanguageContext';
import { usePageTitle } from '../lib/usePageTitle';

export function NotFoundPage() {
  const { t } = useLanguage();
  usePageTitle(t('pageNotFound'));

  return (
    <Layout>
      <section className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
        <h1 className="text-2xl font-black text-slate-900">{t('pageNotFound')}</h1>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          {t('backHome')}
        </Link>
      </section>
    </Layout>
  );
}
