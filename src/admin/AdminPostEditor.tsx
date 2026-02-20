import { useState, useEffect, FormEvent, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_BASE, apiGet, uploadImage, getAdminToken } from '../utils/api';
import type { PostData } from '../hooks/usePages';
import YouTubeEmbed from '../components/YouTubeEmbed';
import ReactQuill from 'react-quill';

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
  parentPage: string;
  author: string;
  date: string;
  videos: string[];
  images: string[];
  imageDisplayMode: 'gallery' | 'carousel';
}

const CATEGORIES = [
  { value: 'survivors', label: 'סיפורי ניצולים / Survivor Stories', parentPage: 'survivor-stories' },
  { value: 'people', label: 'אישים / Famous People', parentPage: 'famous-people' },
  { value: 'events', label: 'אירועים / Events', parentPage: 'events' },
  { value: 'news', label: 'חדשות / News', parentPage: 'community-news' },
  { value: 'content', label: 'תוכן כללי / General Content', parentPage: '' },
];

export default function AdminPostEditor() {
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
    parentPage: '',
    author: 'admin',
    date: new Date().toISOString().split('T')[0],
    videos: [],
    images: [],
    imageDisplayMode: 'gallery',
  });

  useEffect(() => {
    if (id) {
      loadExisting(id);
    }
  }, [id]);

  const loadExisting = async (postId: string) => {
    try {
      const post = await apiGet<PostData>(`/posts/${postId}`);
      if (post) {
        setForm({
          id: post.id,
          slug: post.slug,
          titleHe: post.title?.he || '',
          titleEn: post.title?.en || '',
          excerptHe: post.excerpt?.he || '',
          excerptEn: post.excerpt?.en || '',
          contentHe: post.content?.he || '',
          contentEn: post.content?.en || '',
          category: post.category || 'content',
          parentPage: post.parentPage || '',
          author: post.author || 'admin',
          date: post.date || new Date().toISOString().split('T')[0],
          videos: post.videos || [],
          images: post.images || [],
          imageDisplayMode: post.imageDisplayMode || 'gallery',
        });
      }
    } catch {
      // error loading
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (value: string, lang: 'he' | 'en') => {
    setForm((prev) => {
      const updated = { ...prev, [lang === 'he' ? 'titleHe' : 'titleEn']: value };
      if (!id) {
        const slugSource = lang === 'en' ? value : prev.titleEn || value;
        const slug = generateSlug(slugSource);
        updated.slug = slug;
        updated.id = slug;
      }
      return updated;
    });
  };

  const handleCategoryChange = (category: string) => {
    const cat = CATEGORIES.find((c) => c.value === category);
    setForm((prev) => ({
      ...prev,
      category,
      parentPage: cat?.parentPage || '',
    }));
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
    const postData = {
      id: form.id,
      slug: form.slug,
      title: { he: form.titleHe, en: form.titleEn },
      category: form.category,
      parentPage: form.parentPage,
      date: form.date,
      author: form.author,
      excerpt: { he: form.excerptHe, en: form.excerptEn },
      content: { he: form.contentHe, en: form.contentEn },
      images: form.images,
      videos: form.videos,
      imageDisplayMode: form.imageDisplayMode,
    };

    try {
      const url = id
        ? `${API_BASE}/admin/posts/${id}`
        : `${API_BASE}/admin/posts`;
      const method = id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(postData),
      });

      if (res.ok) {
        setMessage(t('admin.saved'));
        setTimeout(() => navigate('/admin/dashboard'), 1500);
      } else {
        setMessage('Error saving');
      }
    } catch {
      setMessage('Error saving');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>{id ? 'עריכת פוסט / Edit Post' : 'פוסט חדש / New Post'}</h1>
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

        {/* Slug, Category, Date, Author */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Slug / ID</label>
            <input
              className="form-input"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value, id: e.target.value })}
              dir="ltr"
              disabled={!!id}
            />
          </div>
          <div className="form-group">
            <label className="form-label">{t('admin.category')}</label>
            <select
              className="form-select"
              value={form.category}
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Date</label>
            <input
              className="form-input"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Author</label>
            <input
              className="form-input"
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
              dir="ltr"
            />
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
          <ReactQuill
            value={form.contentHe}
            onChange={(value) => setForm({ ...form, contentHe: value })}
            theme="snow"
            modules={{
              toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['blockquote', 'code-block'],
                [{ 'align': [] }],
                ['link'],
                ['clean']
              ]
            }}
            placeholder="ניתן להשתמש ב-HTML..."
            style={{ direction: 'rtl', textAlign: 'right' }}
          />
        </div>
        <div className="form-group">
          <label className="form-label">{t('admin.contentEn')}</label>
          <ReactQuill
            value={form.contentEn}
            onChange={(value) => setForm({ ...form, contentEn: value })}
            theme="snow"
            modules={{
              toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['blockquote', 'code-block'],
                [{ 'align': [] }],
                ['link'],
                ['clean']
              ]
            }}
            placeholder="HTML is supported..."
            style={{ direction: 'ltr', textAlign: 'left' }}
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
            {t('admin.uploadImage')}
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
