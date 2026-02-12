import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiPost, setAdminToken } from '../utils/api';

export default function AdminLogin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await apiPost<{ token: string }>('/admin/login', { password });
      setAdminToken(res.token);
      navigate('/admin/dashboard');
    } catch {
      setError(t('admin.wrongPassword'));
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <h1>{t('admin.login')}</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t('admin.password')}</label>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </div>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            {t('admin.loginButton')}
          </button>
        </form>
      </div>
    </div>
  );
}
