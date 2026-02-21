#!/usr/bin/env node
/**
 * Scrape all blog posts (survivor stories)
 *
 * Usage:
 *   npx tsx scripts/scrape-all-blog-posts.ts
 *
 * This will scrape all blog post pages using the blog-posts.json mapping
 * and save their content to data/posts/<post-id>.json
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface BlogPost {
  id: string;
  he: string;
}

async function scrapeAllBlogPosts() {
  const blogPostsPath = path.join(__dirname, 'blog-posts.json');

  if (!fs.existsSync(blogPostsPath)) {
    console.error('❌ blog-posts.json not found');
    process.exit(1);
  }

  const blogPosts: BlogPost[] = JSON.parse(fs.readFileSync(blogPostsPath, 'utf-8'));

  console.log(`\n📝 Scraping ${blogPosts.length} blog posts...\n`);

  for (const post of blogPosts) {
    try {
      console.log(`⏳ Scraping: ${post.id} (${post.he})...`);
      const hebrewNameEncoded = encodeURIComponent(post.he);
      const url = `https://www.bialystokvicinityexpatsisrael.org.il/post/${hebrewNameEncoded}`;

      execSync(`npx tsx scripts/scrape-page.ts "${url}" "${post.id}"`, {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit',
      });

      console.log(`✅ ${post.id} completed\n`);
    } catch (error) {
      console.error(`❌ Failed to scrape ${post.id}:`, error);
      // Continue with next post
    }
  }

  console.log('\n✨ Blog post scraping complete!');
}

scrapeAllBlogPosts().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
