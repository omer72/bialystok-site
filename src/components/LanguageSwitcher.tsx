import { useLanguage } from '../hooks/useLanguage';

export default function LanguageSwitcher() {
  const { currentLang, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className="lang-switcher"
      aria-label={currentLang === 'he' ? 'Switch to English' : 'עבור לעברית'}
    >
      {currentLang === 'he' ? (
        <>🇺🇸 EN</>
      ) : (
        <>🇮🇱 עב</>
      )}
    </button>
  );
}
