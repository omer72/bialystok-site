import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../hooks/useLanguage';
import { API_BASE, apiGet, apiDelete, getAdminToken, clearAdminToken } from '../utils/api';
import type { PageDef, PostData } from '../hooks/usePages';

type Tab = 'posts' | 'pages';

const CATEGORY_LABELS: Record<string, string> = {
  survivors: 'סיפורי ניצולים / Survivors',
  people: 'אישים / People',
  events: 'אירועים / Events',
  news: 'חדשות / News',
  content: 'תוכן כללי / General',
};

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { getLocalizedText } = useLanguage();
  const navigate = useNavigate();
  const [pages, setPages] = useState<PageDef[]>([]);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('posts');

  const loadPages = async () => {
    try {
      const data = await apiGet<PageDef[]>('/pages');
      setPages(data.sort((a, b) => a.navOrder - b.navOrder));
    } catch {
      // error
    }
  };

  const loadPosts = async () => {
    try {
      const token = getAdminToken()!;
      const res = await fetch(`${API_BASE}/admin/posts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setPosts(await res.json());
      }
    } catch {
      // error
    }
  };

  useEffect(() => {
    loadPages();
    loadPosts();
  }, []);

  const handleDeletePage = async (id: string) => {
    if (!confirm(t('admin.confirmDelete'))) return;
    try {
      await apiDelete(`/pages/${id}`, getAdminToken()!);
      loadPages();
    } catch {
      alert('Failed to delete');
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm(t('admin.confirmDelete'))) return;
    try {
      const token = getAdminToken()!;
      const res = await fetch(`${API_BASE}/admin/posts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        loadPosts();
      } else {
        alert('Failed to delete post');
      }
    } catch {
      alert('Failed to delete post');
    }
  };

  const handleLogout = () => {
    clearAdminToken();
    navigate('/admin');
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>{t('admin.dashboard')}</h1>
        <div className="admin-header-actions">
          <Link to="/admin/post-editor" className="btn btn-primary">
            + פוסט חדש / New Post
          </Link>
          <Link to="/admin/editor" className="btn btn-secondary">
            + {t('admin.createPage')}
          </Link>
          <button onClick={handleLogout} className="btn btn-secondary">
            {t('admin.logout')}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          📝 פוסטים / Posts ({posts.length})
        </button>
        <button
          className={`admin-tab ${activeTab === 'pages' ? 'active' : ''}`}
          onClick={() => setActiveTab('pages')}
        >
          📄 עמודים / Pages ({pages.length})
        </button>
      </div>

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{t('admin.pageTitle')}</th>
                <th>{t('admin.category')}</th>
                <th>Date</th>
                <th>Author</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
                    No posts yet. Click "+ New Post" to create one.
                  </td>
                </tr>
              ) : (
                posts.map((post, i) => (
                  <tr key={post.id}>
                    <td>{i + 1}</td>
                    <td>{getLocalizedText(post.title)}</td>
                    <td>{CATEGORY_LABELS[post.category] || post.category}</td>
                    <td>{post.date}</td>
                    <td>{post.author}</td>
                    <td className="admin-actions">
                      <Link to={`/admin/post-editor/${post.id}`} className="btn btn-secondary btn-sm">
                        {t('admin.editPage')}
                      </Link>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="btn btn-danger btn-sm"
                      >
                        {t('admin.deletePage')}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pages Tab */}
      {activeTab === 'pages' && (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{t('admin.pageTitle')}</th>
                <th>Slug</th>
                <th>Type</th>
                <th>{t('admin.category')}</th>
                <th>Nav</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page, i) => (
                <tr key={page.id}>
                  <td>{i + 1}</td>
                  <td>{getLocalizedText(page.title)}</td>
                  <td><code>{page.slug}</code></td>
                  <td>{page.type}</td>
                  <td>{page.category || '—'}</td>
                  <td>{page.showInNav ? '✓' : '—'}</td>
                  <td className="admin-actions">
                    <Link to={`/admin/editor/${page.id}`} className="btn btn-secondary btn-sm">
                      {t('admin.editPage')}
                    </Link>
                    <button
                      onClick={() => handleDeletePage(page.id)}
                      className="btn btn-danger btn-sm"
                    >
                      {t('admin.deletePage')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
