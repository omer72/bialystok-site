import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../hooks/useLanguage';
import { apiGet, apiDelete, getAdminToken, clearAdminToken } from '../utils/api';
import type { PageDef } from '../hooks/usePages';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { getLocalizedText } = useLanguage();
  const navigate = useNavigate();
  const [pages, setPages] = useState<PageDef[]>([]);

  const loadPages = async () => {
    try {
      const data = await apiGet<PageDef[]>('/pages');
      setPages(data.sort((a, b) => a.navOrder - b.navOrder));
    } catch {
      // error
    }
  };

  useEffect(() => {
    loadPages();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm(t('admin.confirmDelete'))) return;
    try {
      await apiDelete(`/pages/${id}`, getAdminToken()!);
      loadPages();
    } catch {
      alert('Failed to delete');
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
          <Link to="/admin/editor" className="btn btn-primary">
            + {t('admin.createPage')}
          </Link>
          <button onClick={handleLogout} className="btn btn-secondary">
            {t('admin.logout')}
          </button>
        </div>
      </div>

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
                    onClick={() => handleDelete(page.id)}
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
    </div>
  );
}
