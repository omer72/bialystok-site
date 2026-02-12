import { Link } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';

export default function NotFoundPage() {
  const { getLocalizedText } = useLanguage();

  return (
    <div className="page-content container not-found">
      <h1>404</h1>
      <p>
        {getLocalizedText({
          he: 'העמוד שחיפשת לא נמצא',
          en: 'The page you are looking for was not found',
        })}
      </p>
      <Link to="/" className="btn btn-primary">
        {getLocalizedText({ he: 'חזרה לדף הבית', en: 'Back to Homepage' })}
      </Link>
    </div>
  );
}
