import { useTranslation } from 'react-i18next';
import { useLanguage } from '../hooks/useLanguage';
import ContactForm from '../components/ContactForm';
import GoogleMap from '../components/GoogleMap';

export default function ContactPage() {
  const { t } = useTranslation();
  const { getLocalizedText } = useLanguage();

  return (
    <div className="page-content">
      <div className="container">
        <h1 className="page-title">{t('contact.title')}</h1>

        <div className="contact-layout">
          <div className="contact-form-section">
            <ContactForm />
          </div>

          <div className="contact-info-section">
            <h3>{t('contact.address')}</h3>
            <p>
              {getLocalizedText({
                he: 'סובניצו 17, יהוד, ישראל 5621108',
                en: '17 Sovnitzo, Yehud, Israel 5621108',
              })}
            </p>

            <h3>{t('contact.phoneLabel')}</h3>
            <p>972-54-9932329</p>
            <p>972-3-5360037</p>

            <h3>{t('contact.email')}</h3>
            <p>bialystok.israel@gmail.com</p>
          </div>
        </div>

        <div className="contact-map">
          <GoogleMap lat={32.0333} lng={34.8833} />
        </div>
      </div>
    </div>
  );
}
