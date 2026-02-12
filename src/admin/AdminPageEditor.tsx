import { useState, useEffect, FormEvent, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiGet, apiPost, apiPut, uploadImage, getAdminToken } from '../utils/api';
import YouTubeEmbed from '../components/YouTubeEmbed';

interface PostFormData {
  id: string;
  slug: string;
  titleHe: string;
  titleEn: string;
  excerptHe: string;
  excerptEn: string;
  contentHe: string;
  contentEn: string;
  category: string;
  videos: string[];
  images: string[];
  imageDisplayMode: 'gallery' | 'carousel';
  showInNav: boolean;
  navOrder: number;
}

const CATEGORIES = [
  { value: 'survivors', label: 'סיפורי ניצולים / Survivor Stories' },
  { value: 'people', label: 'אישים / Famous People' },
  { value: 'events', label: 'אירועים / Events' },
  { value: 'news', label: 'חדשות / News' },
  { value: 'content', label: 'תוכן כללי / General Content' },
];

export default function AdminPageEditor() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [videoInput, setVideoInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [form, setForm] = useState<PostFormData>({
    id: '',
    slug: '',
    titleHe: '',
    titleEn: '',
    excerptHe: '',
    excerptEn: '',
    contentHe: '',
    contentEn: '',
    category: 'content',
    videos: [],
    images: [],
    imageDisplayMode: 'gallery',
    showInNav: false,
    navOrder: 99,
  });

  useEffect(() => {
    if (id) {
      loadExisting(id);
    }
  }, [id]);

  const loadExisting = async (pageId: string) => {
    try {
      // Load page def
      const pages = await apiGet<any[]>('/pages');
      const page = pages.find((p) => p.id === pageId);

      // Load post data
      let post: any = null;
      try {
        post = await apiGet(`/posts/${pageId}`);
      } catch {
        // No post data
      }

      if (page) {
        setForm({
          id: page.id,
          slug: page.slug,
          titleHe: page.title?.he || '',
          titleEn: page.title?.en || '',
          excerptHe: post?.excerpt?.he || '',
          excerptEn: post?.excerpt?.en || '',
          contentHe: post?.content?.he || '',
          contentEn: post?.content?.en || '',
          category: page.category || post?.category || 'content',
          videos: post?.videos || [],
          images: post?.images || [],
          imageDisplayMode: post?.imageDisplayMode || 'gallery',
          showInNav: page.showInNav ?? false,
          navOrder: page.navOrder ?? 99,
        });
      }
    } catch {
      // error loading
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-\u0590-\u05FF]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (value: string, lang: 'he' | 'en') => {
    setForm((prev) => {
      const updated = { ...prev, [lang === 'he' ? 'titleHe' : 'titleEn']: value };
      if (!id) {
        // Auto-generate slug from English title, fallback to Hebrew
        const slugSource = lang === 'en' ? value : prev.titleEn || value;
        updated.slug = '/' + generateSlug(slugSource);
        updated.id = generateSlug(slugSource);
      }
      return updated;
    });
  };

  const addVideo = () => {
    if (videoInput.trim()) {
      setForm((prev) => ({ ...prev, videos: [...prev.videos, videoInput.trim()] }));
      setVideoInput('');
    }
  };

  const removeVideo = (index: number) => {
    setForm((prev) => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index),
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const token = getAdminToken()!;
    for (const file of Array.from(files)) {
      try {
        const result = await uploadImage(file, token);
        setForm((prev) => ({ ...prev, images: [...prev.images, result.path] }));
      } catch {
        alert(`Failed to upload: ${file.name}`);
      }
    }
    // Reset input so same files can be selected again
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    const token = getAdminToken()!;
    const pageData = {
      id: form.id,
      slug: form.slug,
      title: { he: form.titleHe, en: form.titleEn },
      type: ['survivors', 'people', 'events', 'news'].includes(form.category) ? 'post-list' : 'content',
      category: form.category,
      navOrder: form.navOrder,
      showInNav: form.showInNav,
    };

    const postData = {
      id: form.id,
      slug: form.id,
      title: { he: form.titleHe, en: form.titleEn },
      category: form.category,
      date: new Date().toISOString().split('T')[0],
      author: 'admin',
      excerpt: { he: form.excerptHe, en: form.excerptEn },
      content: { he: form.contentHe, en: form.contentEn },
      images: form.images,
      videos: form.videos,
      imageDisplayMode: form.imageDisplayMode,
      parentPage: form.category === 'survivors' ? 'survivor-stories'
        : form.category === 'people' ? 'famous-people'
        : form.category === 'events' ? 'events'
        : form.category === 'news' ? 'community-news'
        : '',
    };

    try {
      if (id) {
        await apiPut(`/pages/${id}`, { pageData, postData }, token);
      } else {
        await apiPost('/pages', { pageData, postData }, token);
      }
      setMessage(t('admin.saved'));
      setTimeout(() => navigate('/admin/dashboard'), 1500);
    } catch {
      setMessage('Error saving');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>{id ? t('admin.editPage') : t('admin.createPage')}</h1>
        <button onClick={() => navigate('/admin/dashboard')} className="btn btn-secondary">
          {t('admin.cancel')}
        </button>
      </div>

      <form className="admin-editor-form" onSubmit={handleSubmit}>
        {/* Titles */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t('admin.titleHe')}</label>
            <input
              className="form-input"
              value={form.titleHe}
              onChange={(e) => handleTitleChange(e.target.value, 'he')}
              required
              dir="rtl"
            />
          </div>
          <div className="form-group">
            <label className="form-label">{t('admin.titleEn')}</label>
            <input
              className="form-input"
              value={form.titleEn}
              onChange={(e) => handleTitleChange(e.target.value, 'en')}
              dir="ltr"
            />
          </div>
        </div>

        {/* Slug & Category */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Slug</label>
            <input
              className="form-input"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              dir="ltr"
            />
          </div>
          <div className="form-group">
            <label className="form-label">{t('admin.category')}</label>
            <select
              className="form-select"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Excerpts */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t('admin.excerptHe')}</label>
            <textarea
              className="form-textarea"
              value={form.excerptHe}
              onChange={(e) => setForm({ ...form, excerptHe: e.target.value })}
              rows={2}
              dir="rtl"
            />
          </div>
          <div className="form-group">
            <label className="form-label">{t('admin.excerptEn')}</label>
            <textarea
              className="form-textarea"
              value={form.excerptEn}
              onChange={(e) => setForm({ ...form, excerptEn: e.target.value })}
              rows={2}
              dir="ltr"
            />
          </div>
        </div>

        {/* Content */}
        <div className="form-group">
          <label className="form-label">{t('admin.contentHe')}</label>
          <textarea
            className="form-textarea"
            value={form.contentHe}
            onChange={(e) => setForm({ ...form, contentHe: e.target.value })}
            rows={10}
            dir="rtl"
            placeholder="ניתן להשתמש ב-HTML..."
          />
        </div>
        <div className="form-group">
          <label className="form-label">{t('admin.contentEn')}</label>
          <textarea
            className="form-textarea"
            value={form.contentEn}
            onChange={(e) => setForm({ ...form, contentEn: e.target.value })}
            rows={10}
            dir="ltr"
            placeholder="HTML is supported..."
          />
        </div>

        {/* Videos */}
        <div className="form-group">
          <label className="form-label">{t('admin.youtubeUrl')}</label>
          <div className="input-with-button">
            <input
              className="form-input"
              value={videoInput}
              onChange={(e) => setVideoInput(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              dir="ltr"
            />
            <button type="button" className="btn btn-secondary" onClick={addVideo}>
              {t('admin.addVideo')}
            </button>
          </div>
          {form.videos.length > 0 && (
            <div className="video-list">
              {form.videos.map((url, i) => (
                <div key={i} className="video-item">
                  <YouTubeEmbed url={url} />
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => removeVideo(i)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Image display mode */}
        <div className="form-group">
          <label className="form-label">תצוגת תמונות / Image Display</label>
          <select
            className="form-select"
            value={form.imageDisplayMode}
            onChange={(e) => setForm({ ...form, imageDisplayMode: e.target.value as 'gallery' | 'carousel' })}
          >
            <option value="gallery">גלריה (רשת) / Gallery (Grid)</option>
            <option value="carousel">קרוסלה / Carousel (Slider)</option>
          </select>
        </div>

        {/* Images */}
        <div className="form-group">
          <label className="form-label">{t('admin.uploadImage')}</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            📷 {t('admin.uploadImage')}
          </button>
          {form.images.length > 0 && (
            <div className="image-preview-list">
              {form.images.map((src, i) => (
                <div key={i} className="image-preview-item">
                  <img src={src} alt={`Upload ${i + 1}`} />
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => removeImage(i)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nav options */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-checkbox-label">
              <input
                type="checkbox"
                checked={form.showInNav}
                onChange={(e) => setForm({ ...form, showInNav: e.target.checked })}
              />
              {t('admin.addToNav')}
            </label>
          </div>
          {form.showInNav && (
            <div className="form-group">
              <label className="form-label">Nav Order</label>
              <input
                className="form-input"
                type="number"
                value={form.navOrder}
                onChange={(e) => setForm({ ...form, navOrder: parseInt(e.target.value) || 99 })}
                min={1}
              />
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? '...' : t('admin.save')}
          </button>
          {message && <span className="form-message">{message}</span>}
        </div>
      </form>
    </div>
  );
}
