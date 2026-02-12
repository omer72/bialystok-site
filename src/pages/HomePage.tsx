import { useTranslation } from 'react-i18next';
import HeroSection from '../components/HeroSection';

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="home-page">
      <HeroSection />

      <section className="section section-dark">
        <div className="container">
          <h2 className="section-title">{t('home.whoWeAre')}</h2>
          <div className="home-text">
            <p>{t('home.welcomeText')}</p>
            <p>{t('home.missionText')}</p>
            <p>{t('home.virtualMuseum')}</p>
            <p className="home-signature">{t('home.signature')}</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">{t('home.galleryTitle')}</h2>
          <div className="home-gallery">
            <p className="text-center text-muted">
              {t('common.noContent')}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
