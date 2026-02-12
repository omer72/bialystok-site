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
          <a href="https://www.instagram.com/bialystok_israel/" target="_blank" rel="noopener">Instagram</a>
          <a href="https://www.facebook.com/profile.php?id=100064773498498" target="_blank" rel="noopener">Facebook</a>
          <a href="https://www.youtube.com/@user-fk9ue3ds7g" target="_blank" rel="noopener">YouTube</a>
        </div>

        <div className="footer-bottom">
          <p>{getLocalizedText({ he: '©2024 ביאליסטוק', en: '©2024 Bialystok' })} — {t('footer.createdBy')}</p>
        </div>
      </div>
    </footer>
  );
}
