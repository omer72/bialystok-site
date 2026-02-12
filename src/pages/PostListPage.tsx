import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { usePages, PostData } from '../hooks/usePages';
import PostCard from '../components/PostCard';

export default function PostListPage() {
  const location = useLocation();
  const { getLocalizedText } = useLanguage();
  const { getPageBySlug } = usePages();
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);

  const page = getPageBySlug(location.pathname);

  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/posts?category=${page?.category || ''}`);
        if (res.ok) {
          setPosts(await res.json());
        }
      } catch {
        // fallback
      } finally {
        setLoading(false);
      }
    };

    if (page) {
      loadPosts();
    }
  }, [page?.id, page?.category]);

  if (!page) return null;

  return (
    <div className="page-content">
      <div className="container">
        <h1 className="page-title">{getLocalizedText(page.title)}</h1>

        {loading ? (
          <p>{getLocalizedText({ he: 'טוען...', en: 'Loading...' })}</p>
        ) : posts.length > 0 ? (
          <div className="cards-grid">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} basePath={page.slug} />
            ))}
          </div>
        ) : (
          <p className="text-muted">
            {getLocalizedText({ he: 'אין תוכן להצגה', en: 'No content to display' })}
          </p>
        )}
      </div>
    </div>
  );
}
