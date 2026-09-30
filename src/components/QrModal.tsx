import { toDataURL } from 'qrcode';
import { useEffect, useState } from 'react';
import { PLATFORM_NAME } from '../config';
import { useLanguage } from '../i18n/LanguageContext';
import { Modal } from './Modal';

type QrModalProps = {
  open: boolean;
  onClose: () => void;
};

export function QrModal({ open, onClose }: QrModalProps) {
  const { t } = useLanguage();
  const [image, setImage] = useState<string | null>(null);
  const origin = typeof window === 'undefined' ? '' : window.location.origin;

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void toDataURL(origin, {
      margin: 1,
      width: 280,
      color: { dark: '#1e3a8a', light: '#ffffff' },
    })
      .then((url) => {
        if (!cancelled) setImage(url);
      })
      .catch(() => {
        if (!cancelled) setImage(null);
      });
    return () => {
      cancelled = true;
    };
  }, [open, origin]);

  return (
    <Modal open={open} onClose={onClose} titleId="qr-title">
      <h2 id="qr-title" className="text-xl font-bold text-slate-900">
        {t('scanToPlay')}
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">{t('scanHelp')}</p>
      <div className="mt-5 grid place-items-center rounded-2xl border border-slate-200 bg-slate-50 p-4">
        {image ? <img src={image} alt={PLATFORM_NAME} className="h-56 w-56" /> : <p className="text-sm">{origin}</p>}
      </div>
      <p className="mt-3 break-all text-center text-xs text-slate-400">{origin}</p>
      <button
        type="button"
        onClick={onClose}
        className="mt-5 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
      >
        {t('close')}
      </button>
    </Modal>
  );
}
