/**
 * Migration script: Scrape content from old Wix site and create JSON post files.
 *
 * Usage:
 *   npx tsx scripts/migrate-wix-content.ts
 *
 * Prerequisites:
 *   npm install puppeteer (or puppeteer-core)
 *
 * This script:
 * 1. Launches a headless Chrome browser
 * 2. Navigates to each page on the old Wix site
 * 3. Waits for dynamic content to render
 * 4. Extracts text, images, and videos from the DOM
 * 5. Saves JSON files in data/posts/
 * 6. Updates data/pages.json with new page definitions
 */

import puppeteer, { Browser, Page } from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const OLD_SITE = 'https://www.bialystokvicinityexpatsisrael.org.il';
const DATA_DIR = path.join(__dirname, '..', 'data');
const POSTS_DIR = path.join(DATA_DIR, 'posts');
const PAGES_FILE = path.join(DATA_DIR, 'pages.json');
const IMAGES_DIR = path.join(DATA_DIR, '..', 'public', 'images', 'migrated');

// Mapping of old site URLs to our categories and page structure
const PAGE_MAPPINGS: PageMapping[] = [
  // === Content Pages ===
  {
    url: '/about',
    id: 'about',
    category: 'content',
    parentPage: '',
  },
  {
    url: '/about-1',
    id: 'about-extra',
    category: 'content',
    parentPage: 'about',
  },
  {
    url: '/%D7%9E%D7%98%D7%A8%D7%95%D7%AA-%D7%94%D7%A2%D7%9E%D7%95%D7%AA%D7%94',
    id: 'goals',
    category: 'content',
    parentPage: 'about',
  },
  {
    url: '/%D7%9E%D7%91%D7%A0%D7%94-%D7%90%D7%99%D7%A8%D7%92%D7%95%D7%A0%D7%99-%D7%A9%D7%9C-%D7%94%D7%A2%D7%9E%D7%95%D7%AA%D7%94',
    id: 'org-structure',
    category: 'content',
    parentPage: 'about',
  },
  {
    url: '/%D7%A6%D7%99%D7%95%D7%A0%D7%99-%D7%93%D7%A8%D7%9A-%D7%A9%D7%9C-%D7%A7%D7%A8%D7%99%D7%AA-%D7%91%D7%99%D7%90%D7%9C%D7%99%D7%A1%D7%98%D7%95%D7%A7',
    id: 'milestones',
    category: 'content',
    parentPage: 'about',
  },
  {
    url: '/%D7%94%D7%99%D7%A1%D7%98%D7%95%D7%A8%D7%99%D7%AA-%D7%94%D7%A2%D7%99%D7%A8',
    id: 'history',
    category: 'content',
    parentPage: '',
  },
  {
    url: '/%D7%9E%D7%A4%D7%AA-%D7%91%D7%99%D7%90%D7%9C%D7%99%D7%A1%D7%98%D7%95%D7%A7',
    id: 'maps',
    category: 'content',
    parentPage: '',
  },
  {
    url: '/%D7%94%D7%9E%D7%95%D7%96%D7%90%D7%95%D7%9F-%D7%94%D7%99%D7%94%D7%95%D7%93%D7%99-%D7%91%D7%91%D7%99%D7%90%D7%9C%D7%99%D7%A1%D7%98%D7%95%D7%A7',
    id: 'museum',
    category: 'content',
    parentPage: '',
  },
  {
    url: '/%D7%A9%D7%99%D7%A7%D7%95%D7%9D-%D7%91%D7%99%D7%AA-%D7%94%D7%A7%D7%91%D7%A8%D7%95%D7%AA-%D7%94%D7%99%D7%94%D7%95%D7%93%D7%99-%D7%91%D7%91%D7%99%D7%90%D7%9C%D7%99%D7%A1%D7%98%D7%95%D7%A7',
    id: 'cemetery',
    category: 'content',
    parentPage: '',
  },
  {
    url: '/%D7%A1%D7%A4%D7%A8-%D7%96%D7%99%D7%9B%D7%A8%D7%95%D7%9F-%D7%9C%D7%91%D7%99%D7%90%D7%9C%D7%99%D7%A1%D7%98%D7%95%D7%A7',
    id: 'memorial-book',
    category: 'content',
    parentPage: '',
  },
  {
    url: '/videos',
    id: 'videos',
    category: 'content',
    parentPage: '',
  },
  {
    url: '/%D7%90%D7%AA%D7%A8%D7%99%D7%9D-%D7%A7%D7%A9%D7%95%D7%A8%D7%99%D7%9D',
    id: 'related-sites',
    category: 'content',
    parentPage: '',
  },

  // === Famous People (category: people) ===
  {
    url: '/%D7%9E%D7%A8%D7%93%D7%9B%D7%99-%D7%98%D7%A0%D7%A0%D7%91%D7%95%D7%99%D7%9E%D7%A1',
    id: 'mordechai-tenenbaum',
    category: 'people',
    parentPage: 'famous-people',
  },
  {
    url: '/%D7%94%D7%A8%D7%91-%D7%A9%D7%9E%D7%95%D7%90%D7%9C-%D7%9E%D7%95%D7%94%D7%99%D7%9C%D7%99%D7%91%D7%A8',
    id: 'rabbi-mohilever',
    category: 'people',
    parentPage: 'famous-people',
  },
  {
    url: '/%D7%A9%D7%9C%D7%9E%D7%94-%D7%A7%D7%A4%D7%9C%D7%A0%D7%A1%D7%A7%D7%99',
    id: 'shlomo-kaplansky',
    category: 'people',
    parentPage: 'famous-people',
  },
  {
    url: '/%D7%A0%D7%97%D7%95%D7%9D-%D7%A6%D7%9E%D7%97',
    id: 'nahum-tzemach',
    category: 'people',
    parentPage: 'famous-people',
  },
  {
    url: '/%D7%90%D7%9C%D7%A2%D7%96%D7%A8-%D7%9C%D7%99%D7%A4%D7%90-%D7%A1%D7%95%D7%A7%D7%A0%D7%99%D7%A7',
    id: 'elazar-sukenik',
    category: 'people',
    parentPage: 'famous-people',
  },
  {
    url: '/%D7%93%D7%A8-%D7%9C%D7%95%D7%93%D7%95%D7%99%D7%A7-%D7%96%D7%9E%D7%A0%D7%94%D7%95%D7%A3',
    id: 'dr-zamenhof',
    category: 'people',
    parentPage: 'famous-people',
  },
  {
    url: '/%D7%99%D7%A6%D7%97%D7%A7-%D7%A9%D7%9E%D7%99%D7%A8',
    id: 'yitzhak-shamir',
    category: 'people',
    parentPage: 'famous-people',
  },
  {
    url: '/%D7%9E%D7%A9%D7%94-%D7%97%D7%A1%D7%99%D7%93',
    id: 'moshe-hassid',
    category: 'people',
    parentPage: 'famous-people',
  },
  {
    url: '/%D7%A9%D7%9E%D7%95%D7%90%D7%9C-%D7%A4%D7%99%D7%96%D7%90%D7%A8',
    id: 'shmuel-pisar',
    category: 'people',
    parentPage: 'famous-people',
  },
  {
    url: '/%D7%99%D7%95%D7%A1%D7%A3-%D7%97%D7%96%D7%A0%D7%95%D7%91%D7%99%D7%A5',
    id: 'yosef-chazanovitz',
    category: 'people',
    parentPage: 'famous-people',
  },
  {
    url: '/%D7%99%D7%A6%D7%97%D7%A7-%D7%9E%D7%9C%D7%9E%D7%93',
    id: 'yitzhak-malmed',
    category: 'people',
    parentPage: 'famous-people',
  },

  // === Survivor Stories (blog posts, category: survivors) ===
  {
    url: '/post/%D7%99%D7%95%D7%A1%D7%A3-%D7%9E%D7%A7%D7%95%D7%91%D7%A1%D7%A7%D7%99',
    id: 'yosef-makovsky',
    category: 'survivors',
    parentPage: 'survivor-stories',
  },
  {
    url: '/post/%D7%9E%D7%99%D7%A0%D7%94-%D7%A7%D7%99%D7%96%D7%9C%D7%A9%D7%98%D7%99%D7%99%D7%9F-%D7%93%D7%95%D7%A8%D7%95%D7%9F',
    id: 'mina-kizelstein-doron',
    category: 'survivors',
    parentPage: 'survivor-stories',
  },
  {
    url: '/post/%D7%99%D7%A2%D7%A7%D7%95%D7%91-%D7%9E%D7%A7%D7%95%D7%91%D7%A1%D7%A7%D7%99',
    id: 'yaakov-makovsky',
    category: 'survivors',
    parentPage: 'survivor-stories',
  },
  {
    url: '/post/%D7%A0%D7%AA%D7%9F-%D7%90%D7%93%D7%9C%D7%A8',
    id: 'natan-adler',
    category: 'survivors',
    parentPage: 'survivor-stories',
  },
  {
    url: '/post/%D7%A9%D7%9E%D7%90%D7%99-%D7%A7%D7%99%D7%96%D7%99%D7%9C%D7%A9%D7%98%D7%99%D7%99%D7%9F',
    id: 'shamai-kizelstein',
    category: 'survivors',
    parentPage: 'survivor-stories',
  },
  {
    url: '/post/%D7%A8%D7%95%D7%AA-%D7%9E%D7%9C%D7%A6%D7%9E%D7%9F',
    id: 'ruth-maltzman',
    category: 'survivors',
    parentPage: 'survivor-stories',
  },
  {
    url: '/post/%D7%90%D7%A8%D7%99-%D7%90%D7%91%D7%A8%D7%94%D7%9D',
    id: 'ari-avraham',
    category: 'survivors',
    parentPage: 'survivor-stories',
  },
  {
    url: '/post/%D7%A4%D7%A0%D7%97%D7%A1-%D7%95%D7%A0%D7%AA%D7%9F-%D7%90%D7%93%D7%9C%D7%A8',
    id: 'pinchas-natan-adler',
    category: 'survivors',
    parentPage: 'survivor-stories',
  },
  {
    url: '/post/%D7%9E%D7%99%D7%9B%D7%90%D7%9C-%D7%A4%D7%9C%D7%99%D7%A7%D7%A8',
    id: 'michael-flicker',
    category: 'survivors',
    parentPage: 'survivor-stories',
  },
  {
    url: '/post/%D7%A9%D7%9E%D7%97%D7%94-%D7%9C%D7%95%D7%A0%D7%93%D7%95%D7%9F',
    id: 'simcha-london',
    category: 'survivors',
    parentPage: 'survivor-stories',
  },
  {
    url: '/post/%D7%A9%D7%A8%D7%92%D7%90-%D7%A4%D7%99%D7%99%D7%91%D7%9C-%D7%9B%D7%92%D7%9F',
    id: 'shraga-faivel-kagan',
    category: 'survivors',
    parentPage: 'survivor-stories',
  },
  {
    url: '/post/%D7%96%D7%90%D7%91-%D7%91%D7%9C%D7%92%D7%9C%D7%99',
    id: 'zeev-balgli',
    category: 'survivors',
    parentPage: 'survivor-stories',
  },
  {
    url: '/post/%D7%90%D7%9C%D7%99%D7%90%D7%A9-%D7%91%D7%90%D7%95%D7%9E%D7%A5',
    id: 'eliash-baumatz',
    category: 'survivors',
    parentPage: 'survivor-stories',
  },
  {
    url: '/post/%D7%99%D7%9C%D7%93%D7%99-%D7%91%D7%99%D7%90%D7%9C%D7%99%D7%A1%D7%98%D7%95%D7%A7',
    id: 'children-of-bialystok',
    category: 'survivors',
    parentPage: 'survivor-stories',
  },
  {
    url: '/post/%D7%99%D7%A6%D7%97%D7%A7-%D7%91%D7%A8%D7%95%D7%99%D7%93%D7%94',
    id: 'yitzhak-broida',
    category: 'survivors',
    parentPage: 'survivor-stories',
  },
  {
    url: '/post/%D7%90%D7%95%D7%95%D7%94-%D7%A7%D7%A8%D7%A6%D7%95%D7%91%D7%A1%D7%A7%D7%94',
    id: 'eva-kartzovska',
    category: 'survivors',
    parentPage: 'survivor-stories',
  },
  {
    url: '/post/%D7%94%D7%A1%D7%95%D7%A4%D7%A8-%D7%9E%D7%A8%D7%93%D7%9B%D7%99-%D7%93%D7%A0%D7%99%D7%9F',
    id: 'mordechai-danin',
    category: 'survivors',
    parentPage: 'survivor-stories',
  },

  // === Events ===
  {
    url: '/%D7%98%D7%9B%D7%A1-%D7%90%D7%96%D7%9B%D7%A8%D7%94-%D7%94-82-21-8-25-%D7%91%D7%99%D7%94%D7%95%D7%93',
    id: 'memorial-82',
    category: 'events',
    parentPage: 'events',
  },
  {
    url: '/%D7%98%D7%9B%D7%A1-%D7%90%D7%96%D7%9B%D7%A8%D7%94-%D7%94-81-29-8-24-%D7%91%D7%99%D7%94%D7%95%D7%93',
    id: 'memorial-81',
    category: 'events',
    parentPage: 'events',
  },
  {
    url: '/new-page%D7%98%D7%9B%D7%A1-%D7%90%D7%96%D7%9B%D7%A8%D7%94-%D7%94-80-16-8-23-%D7%91%D7%91%D7%99%D7%90%D7%9C%D7%97%D7%99',
    id: 'memorial-80',
    category: 'events',
    parentPage: 'events',
  },
  {
    url: '/%D7%98%D7%9B%D7%A1-%D7%90%D7%96%D7%9B%D7%A8%D7%94-2022-%D7%91%D7%99%D7%94%D7%95%D7%93',
    id: 'memorial-2022',
    category: 'events',
    parentPage: 'events',
  },
  {
    url: '/%D7%98%D7%9B%D7%A1-%D7%90%D7%96%D7%9B%D7%A8%D7%94-%D7%94%D7%94-74',
    id: 'memorial-74',
    category: 'events',
    parentPage: 'events',
  },
  {
    url: '/%D7%90%D7%96%D7%9B%D7%A8%D7%94-5-2-23-%D7%91%D7%91%D7%99%D7%90%D7%9C%D7%99%D7%A1%D7%98%D7%95%D7%A7-%D7%A4%D7%95%D7%9C%D7%99%D7%9F',
    id: 'memorial-poland-2023',
    category: 'events',
    parentPage: 'events',
  },
  {
    url: '/%D7%94%D7%9B%D7%A0%D7%A1%D7%AA-%D7%A1%D7%A4%D7%A8-%D7%AA%D7%95%D7%A8%D7%94-2016',
    id: 'torah-2016',
    category: 'events',
    parentPage: 'events',
  },
  {
    url: '/%D7%9B%D7%A0%D7%A1-%D7%9E%D7%93%D7%A2%D7%99-%D7%91%D7%99%D7%90%D7%9C%D7%99%D7%A1%D7%98%D7%95%D7%A7-%D7%9B%D7%9E%D7%95%D7%93%D7%9C-11-2010',
    id: 'scientific-conference-2010',
    category: 'events',
    parentPage: 'events',
  },
  {
    url: '/%D7%98%D7%9B%D7%A1%D7%99%D7%9D-%D7%9E%D7%A9%D7%A0%D7%99%D7%9D-%D7%A7%D7%95%D7%93%D7%9E%D7%95%D7%AA',
    id: 'past-ceremonies',
    category: 'events',
    parentPage: 'events',
  },
];

interface PageMapping {
  url: string;
  id: string;
  category: string;
  parentPage: string;
}

interface ScrapedPage {
  mapping: PageMapping;
  title: string;
  content: string;
  images: string[];
  videos: string[];
}

// ─── Helpers ───────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-\u0590-\u05FF]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// ─── Scraping logic ────────────────────────────────────────────

async function scrapePage(page: Page, mapping: PageMapping): Promise<ScrapedPage | null> {
  const fullUrl = `${OLD_SITE}${mapping.url}`;
  console.log(`\n📄 Scraping: ${mapping.id} → ${fullUrl}`);

  try {
    await page.goto(fullUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    // Extra wait for Wix dynamic content to render
    await sleep(3000);

    const result = await page.evaluate(() => {
      // Get the page title - try multiple selectors common in Wix
      let title = '';
      const titleSelectors = [
        'h1',
        '[data-hook="blog-post-title"]',
        '[data-testid="richTextElement"] h1',
        '.blog-post-title-font',
      ];
      for (const sel of titleSelectors) {
        const el = document.querySelector(sel);
        if (el && el.textContent?.trim()) {
          title = el.textContent.trim();
          break;
        }
      }

      // Get all content - combine text from rich text elements
      const contentParts: string[] = [];
      const contentSelectors = [
        '[data-testid="richTextElement"]',
        '[data-hook="post-description"]',
        '.blog-post-page-font',
        '[id^="comp-"] p',
        '[id^="comp-"] h2',
        '[id^="comp-"] h3',
        '[id^="comp-"] span',
      ];

      // Collect all rich text elements
      const richTextElements = document.querySelectorAll('[data-testid="richTextElement"]');
      if (richTextElements.length > 0) {
        richTextElements.forEach((el) => {
          const html = (el as HTMLElement).innerHTML;
          if (html.trim()) {
            contentParts.push(html);
          }
        });
      }

      // If no rich text found, try getting text from Wix components
      if (contentParts.length === 0) {
        const allText = document.querySelectorAll('[id^="comp-"]');
        allText.forEach((el) => {
          const paragraphs = el.querySelectorAll('p, h2, h3, h4, li');
          paragraphs.forEach((p) => {
            const text = p.textContent?.trim();
            if (text && text.length > 10) {
              const tag = p.tagName.toLowerCase();
              contentParts.push(`<${tag}>${text}</${tag}>`);
            }
          });
        });
      }

      // Remove duplicates (Wix sometimes nests components)
      const uniqueContent = [...new Set(contentParts)];

      // Get all images
      const images: string[] = [];
      const imgElements = document.querySelectorAll('img[src*="wixstatic"], img[src*="wix"], [data-testid="image"] img, .gallery-item img, wow-image img');
      imgElements.forEach((img) => {
        const src = (img as HTMLImageElement).src || img.getAttribute('data-src') || '';
        if (src && !src.includes('logo') && !src.includes('icon') && !src.includes('favicon')) {
          images.push(src);
        }
      });

      // Also check for background images in Wix galleries
      const bgElements = document.querySelectorAll('[style*="background-image"]');
      bgElements.forEach((el) => {
        const style = (el as HTMLElement).style.backgroundImage;
        const match = style.match(/url\(["']?(.*?)["']?\)/);
        if (match && match[1] && match[1].includes('wixstatic')) {
          images.push(match[1]);
        }
      });

      // Get YouTube videos
      const videos: string[] = [];
      const iframes = document.querySelectorAll('iframe[src*="youtube"], iframe[src*="youtu.be"]');
      iframes.forEach((iframe) => {
        const src = (iframe as HTMLIFrameElement).src;
        if (src) {
          // Convert embed URL to watch URL
          const match = src.match(/embed\/([^?]+)/);
          if (match) {
            videos.push(`https://www.youtube.com/watch?v=${match[1]}`);
          } else {
            videos.push(src);
          }
        }
      });

      // Also check for Wix video elements
      const wixVideos = document.querySelectorAll('[data-hook="youtube-url"]');
      wixVideos.forEach((v) => {
        const url = v.getAttribute('data-hook-url') || v.textContent?.trim() || '';
        if (url && url.includes('youtu')) {
          videos.push(url);
        }
      });

      return {
        title,
        content: uniqueContent.join('\n'),
        images: [...new Set(images)],
        videos: [...new Set(videos)],
      };
    });

    if (!result.title && !result.content) {
      console.log(`   ⚠️  No content found for ${mapping.id}`);
      return null;
    }

    console.log(`   ✅ Title: "${result.title}"`);
    console.log(`   📝 Content length: ${result.content.length} chars`);
    console.log(`   🖼️  Images: ${result.images.length}`);
    console.log(`   🎬 Videos: ${result.videos.length}`);

    return {
      mapping,
      title: result.title,
      content: result.content,
      images: result.images,
      videos: result.videos,
    };
  } catch (error) {
    console.error(`   ❌ Error scraping ${mapping.id}:`, error);
    return null;
  }
}

// ─── Save to JSON ──────────────────────────────────────────────

function savePost(scraped: ScrapedPage) {
  const { mapping, title, content, images, videos } = scraped;

  const postData = {
    id: mapping.id,
    slug: mapping.id,
    title: {
      he: title,
      en: '', // English translation needs manual work
    },
    category: mapping.category,
    date: new Date().toISOString().split('T')[0],
    author: 'migrated',
    excerpt: {
      he: title, // Use title as excerpt placeholder
      en: '',
    },
    content: {
      he: content,
      en: '', // English translation needs manual work
    },
    images,
    videos,
    parentPage: mapping.parentPage,
    imageDisplayMode: images.length > 3 ? 'carousel' : 'gallery',
  };

  const filePath = path.join(POSTS_DIR, `${mapping.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(postData, null, 2), 'utf-8');
  console.log(`   💾 Saved: ${filePath}`);
}

// ─── Main ──────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Starting Wix site content migration...');
  console.log(`📂 Output directory: ${POSTS_DIR}`);
  console.log(`📋 Total pages to scrape: ${PAGE_MAPPINGS.length}\n`);

  // Ensure output directories exist
  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true });
  }
  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
  }

  const browser: Browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--lang=he-IL'],
    defaultViewport: { width: 1280, height: 900 },
  });

  const page = await browser.newPage();

  // Set Hebrew language preference
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'he-IL,he;q=0.9',
  });

  let successCount = 0;
  let failCount = 0;
  const results: ScrapedPage[] = [];

  for (const mapping of PAGE_MAPPINGS) {
    const result = await scrapePage(page, mapping);
    if (result) {
      savePost(result);
      results.push(result);
      successCount++;
    } else {
      failCount++;
    }

    // Brief delay between requests to be polite
    await sleep(1000);
  }

  await browser.close();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary:');
  console.log(`   ✅ Successfully scraped: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📁 Files saved to: ${POSTS_DIR}`);
  console.log('='.repeat(60));

  // Generate a report
  const reportPath = path.join(DATA_DIR, 'migration-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    source: OLD_SITE,
    totalPages: PAGE_MAPPINGS.length,
    success: successCount,
    failed: failCount,
    pages: results.map((r) => ({
      id: r.mapping.id,
      title: r.title,
      category: r.mapping.category,
      contentLength: r.content.length,
      imageCount: r.images.length,
      videoCount: r.videos.length,
    })),
  };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\n📋 Report saved: ${reportPath}`);
  console.log('\n⚠️  Note: English translations are empty and need manual translation.');
  console.log('⚠️  Note: Image URLs point to Wix CDN. To fully migrate images,');
  console.log('   run: npx tsx scripts/download-images.ts');
}

main().catch(console.error);
