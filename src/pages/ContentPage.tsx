import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../hooks/useLanguage';
import { usePages, PostData } from '../hooks/usePages';
import { API_BASE } from '../utils/api';
import YouTubeEmbed from '../components/YouTubeEmbed';
import ImageGallery from '../components/ImageGallery';

export default function ContentPage() {
  const location = useLocation();
  const { t } = useTranslation();
  const { getLocalizedText } = useLanguage();
  const { getPageBySlug } = usePages();
  const [content, setContent] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);

  const page = getPageBySlug(location.pathname);

  // Extract parent path from current pathname (e.g., /about/slug -> /about, /slug -> /)
  const getParentPath = () => {
    const pathname = location.pathname;
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length > 1) {
      return '/' + parts[0];
    }
    return '/';
  };

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      try {
        console.log(`📖 ContentPage: Loading post by ID: ${page?.id}`);
        const res = await fetch(`${API_BASE}/posts/${page?.id}`);
        if (res.ok) {
          const data = await res.json();
          console.log(`✅ ContentPage: Got response, content length:`, data.content?.he?.length || 0);
          console.log(`   Has links-section:`, data.content?.he?.includes('links-section') ? 'YES' : 'NO');
          setContent(data);
        } else {
          console.error(`❌ ContentPage: API returned status ${res.status}`);
        }
      } catch (err) {
        console.error(`❌ ContentPage: Fetch failed:`, err);
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
        <Link to={getParentPath()} className="back-link">
          ← {t('common.backToList')}
        </Link>

        <h1 className="page-title">{getLocalizedText(page.title)}</h1>

        {loading ? (
          <p>{getLocalizedText({ he: 'טוען...', en: 'Loading...' })}</p>
        ) : content ? (
          <div className="content-body">
            <div
              className="rich-content"
              dangerouslySetInnerHTML={{ __html: getLocalizedText(content.content) }}
            />

            {content.videos && content.videos.length > 0 && (
              <div className="content-videos">
                {content.videos.map((url, i) => (
                  <YouTubeEmbed key={i} url={url} title={`${getLocalizedText(content.title)} video ${i + 1}`} />
                ))}
              </div>
            )}

            {content.files && content.files.length > 0 && (
              <div className="post-files">
                {content.files.map((file: { name: string; path?: string }, i: number) => {
                  const isPdf = file.path && file.path.toLowerCase().endsWith('.pdf');
                  const isVideo = file.path && /\.(mp4|webm|ogg)$/i.test(file.path);
                  return isPdf ? (
                    <div key={i} className="file-preview">
                      <iframe src={file.path} width="100%" height="600" style={{ border: 'none', borderRadius: '8px' }} title={file.name} />
                      <p><a href={file.path} target="_blank" rel="noopener">{file.name}</a></p>
                    </div>
                  ) : isVideo ? (
                    <div key={i} className="file-preview">
                      <video width="100%" height="auto" controls style={{ borderRadius: '8px', backgroundColor: '#000' }} title={file.name}>
                        <source src={file.path} type="video/mp4" />
                        {getLocalizedText({ he: 'הדפדפן שלך לא תומך בהשמעת וידאו', en: 'Your browser does not support video playback' })}
                      </video>
                      <p><a href={file.path} target="_blank" rel="noopener" download>{file.name}</a></p>
                    </div>
                  ) : file.path ? (
                    <div key={i} className="file-download">
                      <a href={file.path} target="_blank" rel="noopener" download>{file.name}</a>
                    </div>
                  ) : (
                    <div key={i} className="file-download">
                      <span style={{ color: 'var(--color-text-muted)' }}>{file.name}</span>
                      <br />
                      <small style={{ fontSize: '0.85em', color: 'var(--color-text-muted)' }}>
                        {getLocalizedText({ he: '(קובץ בהכנה - צפוי בקרוב)', en: '(File pending - coming soon)' })}
                      </small>
                    </div>
                  );
                })}
              </div>
            )}

            {content.images && content.images.length > 0 && (
              <ImageGallery images={content.images} alt={getLocalizedText(content.title)} displayMode={content.imageDisplayMode} />
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
