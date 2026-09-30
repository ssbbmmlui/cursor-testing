import { useLanguage } from '../i18n/LanguageContext';
import { Modal } from './Modal';

type SignInNoticeProps = {
  open: boolean;
  onClose: () => void;
};

export function SignInNotice({ open, onClose }: SignInNoticeProps) {
  const { t } = useLanguage();

  return (
    <Modal open={open} onClose={onClose} titleId="sign-in-notice-title">
      <h2 id="sign-in-notice-title" className="text-xl font-bold text-slate-900">
        {t('noticeTitle')}
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">{t('noticeBody')}</p>
      <button
        type="button"
        onClick={onClose}
        className="mt-6 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
      >
        {t('close')}
      </button>
    </Modal>
  );
}
