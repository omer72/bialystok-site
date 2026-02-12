import { useState, useEffect } from 'react';
import { API_BASE } from '../utils/api';

export interface PageDef {
  id: string;
  slug: string;
  title: { he: string; en: string };
  type: 'home' | 'content' | 'post-list' | 'contact';
  navOrder: number;
  showInNav: boolean;
  category?: string;
  children?: string[];
  parentPage?: string;
}

export interface PostData {
  id: string;
  slug: string;
  title: { he: string; en: string };
  category: string;
  date: string;
  author: string;
  excerpt: { he: string; en: string };
  content: { he: string; en: string };
  images: string[];
  videos: string[];
  parentPage: string;
}

export function usePages() {
  const [pages, setPages] = useState<PageDef[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPages = async () => {
    try {
      const res = await fetch(`${API_BASE}/pages`);
      if (res.ok) {
        const data = await res.json();
        setPages(data);
      } else {
        // Fallback to static import
        const data = await import('../../data/pages.json');
        setPages(data.default as PageDef[]);
      }
    } catch {
      // Fallback to static import
      const data = await import('../../data/pages.json');
      setPages(data.default as PageDef[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const navPages = pages
    .filter((p) => p.showInNav)
    .sort((a, b) => a.navOrder - b.navOrder);

  const getPageBySlug = (slug: string) => pages.find((p) => p.slug === slug);
  const getPageById = (id: string) => pages.find((p) => p.id === id);
  const getChildren = (parentId: string) =>
    pages.filter((p) => p.parentPage === parentId);

  return { pages, navPages, loading, getPageBySlug, getPageById, getChildren, refetch: fetchPages };
}
