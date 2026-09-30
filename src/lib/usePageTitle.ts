import { useEffect } from 'react';
import { PLATFORM_NAME } from '../config';

export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${PLATFORM_NAME} · ${title}` : PLATFORM_NAME;
  }, [title]);
}
