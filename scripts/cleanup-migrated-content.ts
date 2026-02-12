/**
 * Clean up migrated content from Wix scraping.
 *
 * Usage:
 *   npx tsx scripts/cleanup-migrated-content.ts
 *
 * This script:
 * 1. Strips Wix CSS classes and inline styles from HTML content
 * 2. Removes footer/copyright text
 * 3. Filters out small icon images (social media icons etc.)
 * 4. Fixes titles where scraper grabbed wrong text
 * 5. Removes redundant nested spans
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const POSTS_DIR = path.join(__dirname, '..', 'data', 'posts');

// Known page titles (Hebrew) for pages where title wasn't scraped properly
const TITLE_OVERRIDES: Record<string, string> = {
  about: 'אודותנו',
  'about-extra': 'אודות הארגון',
  goals: 'מטרות העמותה',
  'org-structure': 'מבנה אירגוני של העמותה',
  maps: 'מפות ביאליסטוק והגטו',
  museum: 'המוזאון היהודי בביאליסטוק',
  videos: 'סרטונים',
  'related-sites': 'אתרים קשורים',
  'memorial-82': 'טכס אזכרה ה-82, 21.8.25 ביהוד',
  'memorial-81': 'טכס אזכרה ה-81, 29.8.24 ביהוד',
  'memorial-80': 'טכס אזכרה ה-80, 16.8.23',
  milestones: 'ציוני דרך של קריית ביאליסטוק',
  'scientific-conference-2010': 'כנס מדעי ביאליסטוק כמודל 11/2010',
  'mordechai-tenenbaum': 'מרדכי טננבוים',
  'rabbi-mohilever': 'הרב שמואל מוהליבר',
  'dr-zamenhof': 'דר לודויג זמנהוף',
};

function cleanHtml(html: string): string {
  if (!html) return '';

  let cleaned = html;

  // Remove ALL class attributes (Wix classes are useless in our site)
  cleaned = cleaned.replace(/\s+class="[^"]*"/g, '');

  // Remove ALL data- attributes
  cleaned = cleaned.replace(/\s+data-[\w-]+="[^"]*"/g, '');

  // Remove ALL inline style attributes
  cleaned = cleaned.replace(/\s+style="[^"]*"/g, '');

  // Remove copyright footer text
  cleaned = cleaned.replace(/<p[^>]*>\s*<span[^>]*>\s*<span[^>]*>\s*©.*?<\/span>\s*<\/span>\s*<\/p>/gs, '');
  cleaned = cleaned.replace(/<p[^>]*>.*?©2022 by ביאלסטוק.*?<\/p>/gs, '');

  // Clean up <br> tags
  cleaned = cleaned.replace(/<br\s*[^>]*>/g, '<br/>');

  // Unwrap redundant nested spans: <span><span>text</span></span> → text
  // Do multiple passes for deeply nested spans
  for (let i = 0; i < 5; i++) {
    cleaned = cleaned.replace(/<span>([^<]*)<\/span>/g, '$1');
  }

  // Remove empty spans
  cleaned = cleaned.replace(/<span>\s*<\/span>/g, '');

  // Remove empty paragraphs (only whitespace or single dot)
  cleaned = cleaned.replace(/<p>\s*\.?\s*<\/p>/g, '');
  cleaned = cleaned.replace(/<p>\s*<br\/>\s*<\/p>/g, '');

  // Remove dir="rtl" from tags (we handle RTL at page level)
  cleaned = cleaned.replace(/\s+dir="rtl"/g, '');

  // Clean up target/rel attributes on links (keep href)
  cleaned = cleaned.replace(/\s+target="[^"]*"/g, '');
  cleaned = cleaned.replace(/\s+rel="[^"]*"/g, '');

  // Clean up whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.trim();

  return cleaned;
}

function filterImages(images: string[]): string[] {
  return images.filter((url) => {
    // Filter out tiny images (icons, social media logos)
    const sizeMatch = url.match(/w_(\d+),h_(\d+)/);
    if (sizeMatch) {
      const w = parseInt(sizeMatch[1]);
      const h = parseInt(sizeMatch[2]);
      if (w <= 50 || h <= 50) return false;
    }
    return true;
  });
}

function fixTitle(post: Record<string, unknown>, id: string): void {
  const title = post.title as { he: string; en: string };
  const override = TITLE_OVERRIDES[id];

  if (override) {
    title.he = override;
  }

  // Clean up titles that are too long (scraped body text instead of actual title)
  if (title.he && title.he.length > 100) {
    const firstLine = title.he.split('\n')[0];
    const firstSentence = firstLine.split('.')[0];
    title.he = firstSentence.length < 100
      ? firstSentence + (firstLine.includes('.') ? '.' : '')
      : firstLine.substring(0, 80) + '...';
  }

  // Fix "404" titles (page not found on old site)
  if (title.he === '404') {
    title.he = override || id.replace(/-/g, ' ');
  }

  // Fix excerpt — use first 120 chars of content if excerpt is too long
  const excerpt = post.excerpt as { he: string; en: string };
  if (excerpt.he && excerpt.he.length > 120) {
    excerpt.he = title.he;
  }
}

function main() {
  const postFiles = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.json'));
  let cleaned = 0;

  for (const file of postFiles) {
    const filePath = path.join(POSTS_DIR, file);
    const post = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const id = path.basename(file, '.json');

    // Fix title
    fixTitle(post, id);

    // Clean HTML content
    if (post.content?.he) {
      post.content.he = cleanHtml(post.content.he);
    }

    // Filter out small icon images
    if (post.images) {
      post.images = filterImages(post.images);
      post.imageDisplayMode = post.images.length > 3 ? 'carousel' : 'gallery';
    }

    // Mark as empty if content is truly just whitespace
    if (post.content?.he && post.content.he.replace(/<[^>]+>/g, '').trim().length < 5) {
      post.content.he = '';
    }

    fs.writeFileSync(filePath, JSON.stringify(post, null, 2), 'utf-8');
    cleaned++;

    const textLength = (post.content?.he || '').replace(/<[^>]+>/g, '').length;
    console.log(`✅ ${id} | title: "${(post.title as {he: string}).he}" | text: ${textLength} chars | imgs: ${post.images?.length || 0}`);
  }

  console.log(`\n📊 Cleaned ${cleaned} files`);
}

main();
