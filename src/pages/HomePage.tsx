import { useTranslation } from 'react-i18next';
import HeroSection from '../components/HeroSection';
import ImageCarousel from '../components/ImageCarousel';

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="home-page">
      <HeroSection />

      <section
        className="section section-dark section-with-bg"
        style={{ backgroundImage: 'url(/images/home.jpg)' }}
      >
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
            
          <ImageCarousel
            images={[
              '/images/gallery-1.jpg',
              '/images/gallery-2.jpg',
              '/images/gallery-3.jpg',
              '/images/gallery-4.jpg',
              '/images/gallery-5.jpg',
              '/images/gallery-6.jpg',
              '/images/gallery-7.jpg',
            ]}
            alt="Gallery"
          />
          </div>
        </div>
      </section>
    </div>
  );
}
