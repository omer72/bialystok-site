import { useLanguage } from '../hooks/useLanguage';

interface HeroSectionProps {
  imageUrl?: string;
}

export default function HeroSection({ imageUrl }: HeroSectionProps) {
  const { getLocalizedText } = useLanguage();

  return (
    <section
      className="hero"
      style={{
        backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
      }}
    >
      <div className="hero-overlay">
        <div className="hero-content">
          <div className="hero-logo">🕍</div>
          <h1 className="hero-title">
            {getLocalizedText({
              he: 'ארגון יוצאי ביאליסטוק והסביבה בישראל',
              en: 'Organization of Bialystok and Vicinity Expats in Israel',
            })}
          </h1>
        </div>
      </div>
    </section>
  );
}
