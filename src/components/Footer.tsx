import { useTranslation } from 'react-i18next';
import { useLanguage } from '../hooks/useLanguage';

export default function Footer() {
  const { t } = useTranslation();
  const { getLocalizedText } = useLanguage();

  return (
    <footer className="footer">
      <div className="container footer-content">
        <div className="footer-info">
          <h3 className="footer-title">
            {getLocalizedText({
              he: 'ארגון יוצאי ביאליסטוק והסביבה בישראל',
              en: 'Bialystok Vicinity Expats in Israel',
            })}
          </h3>
          <p>bialystok.israel@gmail.com</p>
          <p>972-54-9932329 | 972-3-5360037</p>
        </div>

        <div className="footer-social">
          {/* <a href="https://www.instagram.com/bialystok_israel/" target="_blank" rel="noopener" aria-label="Instagram">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5a4.25 4.25 0 0 0 4.25-4.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm5.25-2.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z"/></svg>
          </a> */}
          <a href="https://www.facebook.com/profile.php?id=100082041019277" target="_blank" rel="noopener" aria-label="Facebook">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12Z"/></svg>
          </a>
          {/* <a href="https://www.youtube.com/@user-fk9ue3ds7g" target="_blank" rel="noopener" aria-label="YouTube">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M21.543 6.498C22 8.28 22 12 22 12s0 3.72-.457 5.502a2.859 2.859 0 0 1-2.013 2.023C17.857 20 12 20 12 20s-5.857 0-7.53-.475a2.859 2.859 0 0 1-2.013-2.023C2 15.72 2 12 2 12s0-3.72.457-5.502A2.859 2.859 0 0 1 4.47 4.475C6.143 4 12 4 12 4s5.857 0 7.53.475a2.859 2.859 0 0 1 2.013 2.023ZM10 15.5l6-3.5-6-3.5v7Z"/></svg>
          </a> */}
        </div>

        <div className="footer-bottom">
          <p>{getLocalizedText({ he: '©2024 ביאליסטוק', en: '©2024 Bialystok' })} — {t('footer.createdBy')}</p>
        </div>
      </div>
    </footer>
  );
}
