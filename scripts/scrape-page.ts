/**
 * Scrape a single page from the old Wix site and save/update its post JSON.
 *
 * Usage:
 *   npx tsx scripts/scrape-page.ts <url> <post-id>
 *
 * Examples:
 *   npx tsx scripts/scrape-page.ts "https://www.bialystokvicinityexpatsisrael.org.il/%D7%9E%D7%A4%D7%AA-%D7%91%D7%99%D7%90%D7%9C%D7%99%D7%A1%D7%98%D7%95%D7%A7" maps
 *
 * This will:
 * 1. Open the URL in headless Chrome
 * 2. Extract text, images, and videos
 * 3. Download images locally
 * 4. Update (or create) the post JSON in data/posts/<post-id>.json
 */

import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const DATA_DIR = path.join(__dirname, '..', 'data');
const POSTS_DIR = path.join(DATA_DIR, 'posts');
const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images', 'migrated');

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const protocol = url.startsWith('https') ? https : http;
    protocol
      .get(url, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            file.close();
            fs.unlinkSync(dest);
            return downloadFile(redirectUrl, dest).then(resolve).catch(reject);
          }
        }
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      })
      .on('error', (err) => {
        fs.unlinkSync(dest);
        reject(err);
      });
  });
}

function getExtensionFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const ext = path.extname(pathname).split('?')[0];
    return ext || '.jpg';
  } catch {
    return '.jpg';
  }
}

async function scrapePage(url: string) {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--lang=he-IL'],
    defaultViewport: { width: 1280, height: 900 },
  });

  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'he-IL,he;q=0.9' });

  console.log(`\n🌐 Loading: ${url}`);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

  // Scroll down to trigger lazy-loaded content
  const scrollHeight = await page.evaluate('document.body.scrollHeight') as number;
  for (let y = 0; y < scrollHeight; y += 400) {
    await page.evaluate(`window.scrollTo(0, ${y})`);
    await new Promise((r) => setTimeout(r, 200));
  }
  await page.evaluate('window.scrollTo(0, 0)');
  // Wait for Wix dynamic content to render after scroll
  await new Promise((r) => setTimeout(r, 5000));

  const result = await page.evaluate(`(function() {
    // --- Title ---
    var title = '';
    var titleSelectors = [
      '[data-hook="blog-post-title"]',
      '.blog-post-title-font',
      'h1',
      '[data-testid="richTextElement"] h1'
    ];
    for (var i = 0; i < titleSelectors.length; i++) {
      var el = document.querySelector(titleSelectors[i]);
      if (el && el.textContent && el.textContent.trim()) {
        title = el.textContent.trim();
        break;
      }
    }

    // --- Content ---
    var contentParts = [];
    var seenText = {};

    var addContent = function(html, text) {
      var trimmed = text.trim();
      if (!trimmed || trimmed.length < 5) return;
      if (trimmed.indexOf('©') !== -1 || trimmed.indexOf('Proudly created') !== -1 || trimmed.indexOf('Wix.com') !== -1) return;
      if (seenText[trimmed]) return;
      seenText[trimmed] = true;
      contentParts.push(html);
    };

    // 1. Wix blog post body (most reliable for blog posts)
    var postBody = document.querySelector('[data-hook="post-description"]');
    if (postBody) {
      var bodyHtml = postBody.innerHTML ? postBody.innerHTML.trim() : '';
      if (bodyHtml) addContent(bodyHtml, postBody.textContent || '');
    }

    // 2. Rich text elements (content pages)
    if (contentParts.length === 0) {
      document.querySelectorAll('[data-testid="richTextElement"]').forEach(function(el) {
        var html = el.innerHTML ? el.innerHTML.trim() : '';
        if (html) addContent(html, el.textContent || '');
      });
    }

    // 3. Wix blog content wrapper
    if (contentParts.length === 0) {
      document.querySelectorAll('.blog-post-page-font, [data-hook="post-body"] [data-testid="richTextElement"]').forEach(function(el) {
        var html = el.innerHTML ? el.innerHTML.trim() : '';
        if (html) addContent(html, el.textContent || '');
      });
    }

    // 4. Fallback: grab paragraphs from Wix comp elements
    if (contentParts.length === 0) {
      document.querySelectorAll('[id^="comp-"]').forEach(function(el) {
        el.querySelectorAll('p, h1, h2, h3, h4, h5, li, blockquote').forEach(function(p) {
          var text = p.textContent ? p.textContent.trim() : '';
          var tag = p.tagName.toLowerCase();
          addContent('<' + tag + '>' + text + '</' + tag + '>', text);
        });
      });
    }

    // --- Meta description fallback ---
    var metaDesc = '';
    var metaEl = document.querySelector('meta[name="description"], meta[property="og:description"]');
    if (metaEl) {
      metaDesc = metaEl.getAttribute('content') || '';
    }

    // --- Images ---
    var images = [];
    var imgSeen = {};
    document.querySelectorAll('img[src*="wixstatic"], img[src*="wix"], [data-testid="image"] img, .gallery-item img, wow-image img').forEach(function(img) {
      var src = img.src || img.getAttribute('data-src') || '';
      if (!src || imgSeen[src]) return;
      if (src.indexOf('logo') !== -1 || src.indexOf('icon') !== -1 || src.indexOf('favicon') !== -1) return;
      // Skip tiny images (social icons, decorations) — check natural dimensions
      var w = img.naturalWidth || img.width || 0;
      var h = img.naturalHeight || img.height || 0;
      if (w > 0 && w < 100 && h > 0 && h < 100) return;
      // Skip social media icon URLs
      if (src.indexOf('social') !== -1 || src.indexOf('instagram') !== -1 || src.indexOf('facebook') !== -1 || src.indexOf('youtube') !== -1 || src.indexOf('twitter') !== -1) return;
      imgSeen[src] = true;
      images.push(src);
    });

    // Background images
    document.querySelectorAll('[style*="background-image"]').forEach(function(el) {
      var match = el.style.backgroundImage.match(/url\\(["']?(.*?)["']?\\)/);
      if (match && match[1] && match[1].indexOf('wixstatic') !== -1 && !imgSeen[match[1]]) {
        imgSeen[match[1]] = true;
        images.push(match[1]);
      }
    });

    // --- Videos ---
    var videos = [];
    var vidSeen = {};
    document.querySelectorAll('iframe[src*="youtube"], iframe[src*="youtu.be"]').forEach(function(iframe) {
      var src = iframe.src;
      if (src) {
        var match = src.match(/embed\\/([^?]+)/);
        var url = match ? 'https://www.youtube.com/watch?v=' + match[1] : src;
        if (!vidSeen[url]) { vidSeen[url] = true; videos.push(url); }
      }
    });

    // --- Files (PDF, MP4, etc.) ---
    var files = [];
    document.querySelectorAll('[data-hook="file-upload-viewer"]').forEach(function(viewer) {
      var nameEl = viewer.querySelector('[data-hook="file-upload-name"]');
      var extEl = viewer.querySelector('[data-hook="file-upload-extension"]');
      var name = nameEl ? nameEl.textContent.trim() : '';
      var ext = extEl ? extEl.textContent.trim() : '';
      if (name) {
        files.push({ name: name, ext: ext });
      }
    });

    // --- Links from buttons ---
    var linkSections = [];
    var seenLinks = {};
    document.querySelectorAll('[data-semantic-classname="button"]').forEach(function(btn) {
      var link = btn.querySelector('a[data-testid="linkElement"]');
      if (link && link.href && !seenLinks[link.href]) {
        var text = link.textContent ? link.textContent.trim() : '';
        if (text && text.length > 0) {
          seenLinks[link.href] = true;
          linkSections.push('<a href="' + link.href + '" target="_blank" rel="noopener">' + text + '</a>');
        }
      }
    });

    var content = contentParts.join('\\n');
    if (linkSections.length > 0) {
      content += '\\n<div class="links-section">\\n' + linkSections.join('\\n') + '\\n</div>';
    }

    return {
      title: title,
      content: content || (metaDesc ? '<p>' + metaDesc + '</p>' : ''),
      images: images,
      videos: videos,
      files: files
    };
  })()`) as { title: string; content: string; images: string[]; videos: string[]; files: { name: string; ext: string }[] };

  await browser.close();
  return result;
}

async function main() {
  const [, , url, postId] = process.argv;

  if (!url || !postId) {
    console.error('Usage: npx tsx scripts/scrape-page.ts <url> <post-id>');
    process.exit(1);
  }

  ensureDir(POSTS_DIR);

  // Scrape
  const scraped = await scrapePage(url);

  console.log(`\n📋 Results:`);
  console.log(`   Title:   "${scraped.title}"`);
  console.log(`   Content: ${scraped.content.length} chars`);
  console.log(`   Images:  ${scraped.images.length}`);
  console.log(`   Videos:  ${scraped.videos.length}`);
  console.log(`   Files:   ${scraped.files.length}`);

  // Download images
  const postImageDir = path.join(IMAGES_DIR, postId);
  ensureDir(postImageDir);
  const localImages: string[] = [];

  for (let i = 0; i < scraped.images.length; i++) {
    const imgUrl = scraped.images[i];
    const ext = getExtensionFromUrl(imgUrl);
    const filename = `${postId}-${i + 1}${ext}`;
    const destPath = path.join(postImageDir, filename);
    const localPath = `/images/migrated/${postId}/${filename}`;

    try {
      console.log(`   ⬇️  Downloading image ${i + 1}/${scraped.images.length}...`);
      await downloadFile(imgUrl, destPath);
      localImages.push(localPath);
      console.log(`   ✅ ${filename}`);
    } catch {
      console.error(`   ❌ Failed: ${imgUrl}`);
      localImages.push(imgUrl);
    }
  }

  // Replace Wix file-upload-viewer blocks with placeholders for manually added files
  if (scraped.files.length > 0) {
    console.log(`\n   📎 Found ${scraped.files.length} file attachment(s):`);
    const fileEntries: { name: string; ext: string }[] = [];
    for (const file of scraped.files) {
      console.log(`      - ${file.name}${file.ext}`);
      fileEntries.push(file);

      // Replace Wix file-upload-viewer block with a placeholder comment
      const viewerRegex = /<div[^>]*data-hook="file-upload-viewer"[^>]*>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/;
      scraped.content = scraped.content.replace(viewerRegex, '');
    }
    console.log(`   ⚠️  Download these files manually from the old site and add to post JSON "files" array`);
    console.log(`      Place files in: public/files/migrated/${postId}/`);
    console.log(`      Then add to JSON: "files": [{ "name": "...", "path": "/files/migrated/${postId}/..." }]`);
  }

  // Load existing post or create new one
  const postPath = path.join(POSTS_DIR, `${postId}.json`);
  let post: Record<string, any> = {};
  if (fs.existsSync(postPath)) {
    post = JSON.parse(fs.readFileSync(postPath, 'utf-8'));
    console.log(`\n📝 Updating existing post: ${postId}`);
  } else {
    console.log(`\n📝 Creating new post: ${postId}`);
  }

  // Merge — only overwrite fields that were actually scraped
  post.id = post.id || postId;
  post.slug = post.slug || postId;
  if (scraped.title) {
    post.title = { he: scraped.title, en: post.title?.en || '' };
  }
  post.category = post.category || 'content';
  post.date = post.date || new Date().toISOString().split('T')[0];
  post.author = post.author || 'migrated';
  if (scraped.content) {
    post.content = { he: scraped.content, en: post.content?.en || '' };
  }
  post.excerpt = post.excerpt || { he: scraped.title || '', en: '' };
  if (localImages.length > 0) {
    post.images = localImages;
  }
  if (scraped.videos.length > 0) {
    post.videos = scraped.videos;
  }
  post.parentPage = post.parentPage || '';
  post.imageDisplayMode = post.imageDisplayMode || (localImages.length > 3 ? 'carousel' : 'gallery');

  fs.writeFileSync(postPath, JSON.stringify(post, null, 2), 'utf-8');
  console.log(`💾 Saved: ${postPath}`);
}

main().catch(console.error);
