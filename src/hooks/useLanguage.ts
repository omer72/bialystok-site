import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';

export function useLanguage() {
  const { i18n } = useTranslation();

  const currentLang = i18n.language as 'he' | 'en';
  const isRtl = currentLang === 'he';

  const toggleLanguage = useCallback(() => {
    const newLang = currentLang === 'he' ? 'en' : 'he';
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  }, [currentLang, i18n]);

  const getLocalizedText = useCallback(
    (text: { he: string; en: string } | string): string => {
      if (typeof text === 'string') return text;
      return text[currentLang] || text.he;
    },
    [currentLang]
  );

  return { currentLang, isRtl, toggleLanguage, getLocalizedText };
}
