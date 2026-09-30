import { LogOut, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import type { AuthUser } from '../auth/types';
import { useLanguage } from '../i18n/LanguageContext';

type UserMenuProps = {
  user: AuthUser;
  onSignOut: () => void;
};

export function UserMenu({ user, onSignOut }: UserMenuProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const letter = user.name.trim().charAt(0).toUpperCase() || '?';

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('pointerdown', onPointer);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-blue-600 text-sm font-bold text-white"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          letter
        )}
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
        >
          <p className="px-3 py-2 text-xs text-slate-500">
            {t('signedInAs')}
            <span className="mt-1 block text-sm font-semibold text-slate-800">{user.name}</span>
          </p>
          <Link
            to="/profile"
            role="menuitem"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            onClick={() => setOpen(false)}
          >
            <User className="h-4 w-4" aria-hidden="true" />
            {t('profile')}
          </Link>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {t('signOut')}
          </button>
        </div>
      ) : null}
    </div>
  );
}
