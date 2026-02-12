import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../hooks/useLanguage';
import type { PostData } from '../hooks/usePages';
import YouTubeEmbed from '../components/YouTubeEmbed';
import ImageGallery from '../components/ImageGallery';

export default function PostDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const { getLocalizedText } = useLanguage();
  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPost = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/posts/by-slug/${slug}`);
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
        <Link to=".." className="back-link">
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

          {post.images.length > 1 && (
            <div className="post-gallery">
              <h3>{getLocalizedText({ he: 'גלריה', en: 'Gallery' })}</h3>
              <ImageGallery images={post.images.slice(1)} alt={getLocalizedText(post.title)} />
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
