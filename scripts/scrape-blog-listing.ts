#!/usr/bin/env node
/**
 * Scrape the blog listing page to discover all blog posts
 *
 * Usage:
 *   npx tsx scripts/scrape-blog-listing.ts
 *
 * This will:
 * 1. Visit https://www.bialystokvicinityexpatsisrael.org.il/blog
 * 2. Extract all blog post links
 * 3. Save them to scripts/blog-posts-discovered.json
 */

import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BLOG_LISTING_URL = 'https://www.bialystokvicinityexpatsisrael.org.il/blog';

interface BlogPostLink {
  url: string;
  title: string;
  id: string;
}

async function scrapeBlogListing(): Promise<BlogPostLink[]> {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--lang=he-IL'],
    defaultViewport: { width: 1280, height: 900 },
  });

  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'he-IL,he;q=0.9' });

  console.log(`\n🌐 Loading blog listing: ${BLOG_LISTING_URL}`);
  await page.goto(BLOG_LISTING_URL, { waitUntil: 'networkidle2', timeout: 30000 });

  // Wait for Wix to render
  await new Promise((r) => setTimeout(r, 3000));

  // Scroll to load all posts (Wix often lazy-loads)
  console.log('⏳ Scrolling to load all blog posts...');
  let previousHeight = 0;
  let currentHeight = await page.evaluate('document.body.scrollHeight') as number;

  while (previousHeight !== currentHeight) {
    previousHeight = currentHeight;
    await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    await new Promise((r) => setTimeout(r, 2000));
    currentHeight = await page.evaluate('document.body.scrollHeight') as number;
  }

  // Scroll back to top
  await page.evaluate('window.scrollTo(0, 0)');
  await new Promise((r) => setTimeout(r, 1000));

  // Extract blog post links
  const posts = await page.evaluate(() => {
    const blogPosts: BlogPostLink[] = [];
    const seenUrls = new Set<string>();

    // Look for blog post links
    // Wix typically uses data-testid="linkElement" or regular <a> tags in post cards
    document.querySelectorAll('[data-testid="richTextElement"] a, .blog-item a, [data-hook*="post"] a, article a').forEach((link: any) => {
      const href = link.getAttribute('href');
      const text = link.textContent?.trim() || '';

      // Filter to blog post links (should contain /post/ or similar)
      if (href && href.includes('/post/') && text.length > 3 && !seenUrls.has(href)) {
        seenUrls.add(href);

        // Create ID from URL or text
        const urlParts = href.split('/');
        const urlTitle = urlParts[urlParts.length - 1] || text;
        const id = urlTitle.toLowerCase()
          .replace(/%20/g, '-')
          .replace(/[^\w\-]/g, '')
          .substring(0, 50);

        blogPosts.push({
          url: href.startsWith('http') ? href : 'https://www.bialystokvicinityexpatsisrael.org.il' + href,
          title: text,
          id: id,
        });
      }
    });

    return blogPosts;
  }) as BlogPostLink[];

  console.log(`\n✅ Found ${posts.length} blog posts`);
  posts.forEach((post, i) => {
    console.log(`   ${i + 1}. "${post.title}"`);
    console.log(`      → ${post.url}`);
  });

  await browser.close();

  return posts;
}

async function main() {
  const blogPosts = await scrapeBlogListing();

  // Save to file
  const outputPath = path.join(__dirname, 'blog-posts-discovered.json');
  fs.writeFileSync(outputPath, JSON.stringify(blogPosts, null, 2), 'utf-8');
  console.log(`\n💾 Saved ${blogPosts.length} blog posts to: ${outputPath}`);
}

main().catch(console.error);
