import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { usePages, PostData } from '../hooks/usePages';
import { API_BASE } from '../utils/api';
import YouTubeEmbed from '../components/YouTubeEmbed';
import ImageGallery from '../components/ImageGallery';

export default function ContentPage() {
  const location = useLocation();
  const { getLocalizedText } = useLanguage();
  const { getPageBySlug } = usePages();
  const [content, setContent] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);

  const page = getPageBySlug(location.pathname);

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/posts/${page?.id}`);
        if (res.ok) {
          setContent(await res.json());
        }
      } catch {
        // Content might be inline in page definition
      } finally {
        setLoading(false);
      }
    };

    if (page) {
      loadContent();
    } else {
      setLoading(false);
    }
  }, [page?.id]);

  if (!page) {
    return (
      <div className="page-content container">
        <h1>{getLocalizedText({ he: 'עמוד לא נמצא', en: 'Page Not Found' })}</h1>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="container">
        <h1 className="page-title">{getLocalizedText(page.title)}</h1>

        {loading ? (
          <p>{getLocalizedText({ he: 'טוען...', en: 'Loading...' })}</p>
        ) : content ? (
          <div className="content-body">
            <div
              className="rich-content"
              dangerouslySetInnerHTML={{ __html: getLocalizedText(content.content) }}
            />

            {content.videos.length > 0 && (
              <div className="content-videos">
                {content.videos.map((url, i) => (
                  <YouTubeEmbed key={i} url={url} title={`${getLocalizedText(content.title)} video ${i + 1}`} />
                ))}
              </div>
            )}

            {content.images.length > 0 && (
              <ImageGallery images={content.images} alt={getLocalizedText(content.title)} />
            )}
          </div>
        ) : (
          <p className="text-muted">
            {getLocalizedText({ he: 'תוכן בקרוב...', en: 'Content coming soon...' })}
          </p>
        )}
      </div>
    </div>
  );
}
