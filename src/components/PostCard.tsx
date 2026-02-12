import { Link } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import type { PostData } from '../hooks/usePages';

interface PostCardProps {
  post: PostData;
  basePath: string;
}

export default function PostCard({ post, basePath }: PostCardProps) {
  const { getLocalizedText } = useLanguage();

  return (
    <article className="post-card">
      {post.images.length > 0 && (
        <div className="post-card-image">
          <img src={post.images[0]} alt={getLocalizedText(post.title)} />
        </div>
      )}
      <div className="post-card-body">
        <div className="post-card-meta">
          <span className="post-card-author">{post.author}</span>
          <span className="post-card-date">
            {new Date(post.date).toLocaleDateString('he-IL')}
          </span>
        </div>
        <h3 className="post-card-title">
          <Link to={`${basePath}/${post.slug}`}>{getLocalizedText(post.title)}</Link>
        </h3>
        <p className="post-card-excerpt">{getLocalizedText(post.excerpt)}</p>
        <Link to={`${basePath}/${post.slug}`} className="post-card-link">
          {getLocalizedText({ he: 'קרא עוד', en: 'Read More' })} →
        </Link>
      </div>
    </article>
  );
}
