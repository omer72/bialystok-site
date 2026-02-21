#!/usr/bin/env node
/**
 * Scrape blog posts from the blog listing page
 *
 * Usage:
 *   npx tsx scripts/scrape-blog-posts.ts
 *
 * This will:
 * 1. Scrape the blog listing page to discover blog posts
 * 2. Scrape each individual blog post
 * 3. Save blog post data to data/posts/<post-id>.json
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BLOG_LISTING_URL = 'https://www.bialystokvicinityexpatsisrael.org.il/blog';

interface BlogPostLink {
  url: string;
  title: string;
  id: string;
}

async function discoverBlogPosts(): Promise<BlogPostLink[]> {
  console.log(`\n🌐 Discovering blog posts from: ${BLOG_LISTING_URL}\n`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--lang=he-IL'],
    defaultViewport: { width: 1280, height: 900 },
  });

  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'he-IL,he;q=0.9' });

  try {
    await page.goto(BLOG_LISTING_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 3000));

    // Scroll to load all posts
    console.log('⏳ Scrolling to load all blog posts...');
    let previousHeight = 0;
    let currentHeight = await page.evaluate('document.body.scrollHeight') as number;

    while (previousHeight !== currentHeight) {
      previousHeight = currentHeight;
      await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
      await new Promise((r) => setTimeout(r, 2000));
      currentHeight = await page.evaluate('document.body.scrollHeight') as number;
    }

    // Extract blog post links
    const posts = await page.evaluate(() => {
      const blogPosts: BlogPostLink[] = [];
      const seenUrls = new Set<string>();

      // Look for blog post links - Wix typically uses these selectors
      document.querySelectorAll('a[href*="/post/"]').forEach((link: any) => {
        const href = link.getAttribute('href');
        const text = link.textContent?.trim() || '';

        if (href && text.length > 3 && !seenUrls.has(href)) {
          seenUrls.add(href);

          // Create ID from URL
          const urlParts = href.split('/');
          let urlTitle = urlParts[urlParts.length - 1] || '';

          // URL decode the title first
          let id = '';
          if (urlTitle) {
            try {
              id = decodeURIComponent(urlTitle)
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^\w\-\u0590-\u05FF]/g, '') // Keep alphanumeric, dashes, and Hebrew chars
                .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
                .replace(/-+/g, '-') // Replace multiple dashes with single dash
                .substring(0, 50);
            } catch {
              id = '';
            }
          }

          // If URL-based ID is empty, use transliteration of Hebrew text
          if (!id || id === '-') {
            // Simple Hebrew to Latin transliteration
            const hebrewMap: { [key: string]: string } = {
              'א': 'a', 'ב': 'b', 'ג': 'g', 'ד': 'd', 'ה': 'h', 'ו': 'v', 'ז': 'z',
              'ח': 'kh', 'ט': 't', 'י': 'y', 'כ': 'k', 'ל': 'l', 'מ': 'm', 'נ': 'n',
              'ס': 's', 'ע': '', 'פ': 'p', 'צ': 'ts', 'ק': 'k', 'ר': 'r', 'ש': 'sh',
              'ת': 't', 'ך': 'k', 'ם': 'm', 'ן': 'n', 'ף': 'f', 'ץ': 'ts'
            };

            let translit = text
              .toLowerCase()
              .split('')
              .map((char: string) => hebrewMap[char] || char)
              .join('')
              .replace(/\s+/g, '-')
              .replace(/[^\w\-]/g, '')
              .replace(/^-+|-+$/g, '')
              .replace(/-+/g, '-')
              .substring(0, 50);

            if (translit && translit !== '-') {
              id = translit;
            }
          }

          // Final fallback: use a hash of the text
          if (!id || id === '-') {
            const hash = text
              .split('')
              .reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
              .toString(36);
            id = `post-${hash}`.substring(0, 50);
          }

          const fullUrl = href.startsWith('http') ? href : 'https://www.bialystokvicinityexpatsisrael.org.il' + href;

          blogPosts.push({
            url: fullUrl,
            title: text,
            id: id,
          });
        }
      });

      return blogPosts;
    }) as BlogPostLink[];

    console.log(`\n✅ Discovered ${posts.length} blog posts:\n`);
    posts.forEach((post, i) => {
      console.log(`   ${i + 1}. "${post.title}"`);
      console.log(`      ID: ${post.id}`);
      console.log(`      → ${post.url}\n`);
    });

    return posts;
  } finally {
    await browser.close();
  }
}

async function scrapeBlogPosts(posts: BlogPostLink[]) {
  console.log(`\n📝 Scraping ${posts.length} blog posts...\n`);

  for (const post of posts) {
    try {
      console.log(`⏳ Scraping: ${post.id} (${post.title})...`);
      execSync(`npx tsx scripts/scrape-page.ts "${post.url}" "${post.id}"`, {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit',
      });
      console.log(`✅ ${post.id} completed\n`);
    } catch (error) {
      console.error(`❌ Failed to scrape ${post.id}:`, error);
      // Continue with next post
    }
  }
}

async function main() {
  try {
    const blogPosts = await discoverBlogPosts();
    if (blogPosts.length === 0) {
      console.log('⚠️  No blog posts found. Check the blog listing page structure.');
      process.exit(0);
    }

    await scrapeBlogPosts(blogPosts);
    console.log('\n✨ Blog post scraping complete!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
