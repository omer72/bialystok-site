import { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../hooks/useLanguage';
import type { PostData } from '../hooks/usePages';
import { API_BASE } from '../utils/api';
import YouTubeEmbed from '../components/YouTubeEmbed';
import ImageGallery from '../components/ImageGallery';

export default function PostDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const { t } = useTranslation();
  const { getLocalizedText } = useLanguage();
  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);

  // Extract parent path from current pathname (e.g., /blog/slug -> /blog, /people/slug -> /people)
  const getParentPath = () => {
    const pathname = location.pathname;
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length > 1) {
      return '/' + parts[0];
    }
    return '/';
  };

  useEffect(() => {
    const loadPost = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/posts/by-slug/${slug}`);
        if (res.ok) {
          setPost(await res.json());
        }
      } catch {
        // error
      } finally {
        setLoading(false);
      }
    };

    if (slug) loadPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="page-content container">
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="page-content container">
        <h1>{getLocalizedText({ he: 'עמוד לא נמצא', en: 'Page Not Found' })}</h1>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="container post-detail">
        <Link to={getParentPath()} className="back-link">
          ← {t('common.backToList')}
        </Link>

        <article>
          <header className="post-header">
            <h1 className="post-title">{getLocalizedText(post.title)}</h1>
            <div className="post-meta">
              <span>{t('common.by')} {post.author}</span>
              <span>•</span>
              <span>{new Date(post.date).toLocaleDateString('he-IL')}</span>
            </div>
          </header>

          {post.images.length > 0 && (
            <div className="post-featured-image">
              <img src={post.images[0]} alt={getLocalizedText(post.title)} />
            </div>
          )}

          <div
            className="rich-content"
            dangerouslySetInnerHTML={{ __html: getLocalizedText(post.content) }}
          />

          {post.videos.length > 0 && (
            <div className="post-videos">
              <h3>{getLocalizedText({ he: 'סרטונים', en: 'Videos' })}</h3>
              {post.videos.map((url, i) => (
                <YouTubeEmbed key={i} url={url} title={`${getLocalizedText(post.title)} video ${i + 1}`} />
              ))}
            </div>
          )}

          {post.files && post.files.length > 0 && (
            <div className="post-files">
              <h3>{getLocalizedText({ he: 'קבצים', en: 'Files' })}</h3>
              {post.files.map((file: { name: string; path?: string }, i: number) => {
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

          {post.images.length > 1 && (
            <div className="post-gallery">
              <h3>{getLocalizedText({ he: 'גלריה', en: 'Gallery' })}</h3>
              <ImageGallery images={post.images.slice(1)} alt={getLocalizedText(post.title)} displayMode={post.imageDisplayMode} />
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
