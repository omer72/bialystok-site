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

  // Wait for Wix initial render
  await new Promise((r) => setTimeout(r, 3000));

  // Aggressively scroll to load all carousel images (28 images = need multiple passes)
  console.log('⏳ Loading carousel images (this may take a moment)...');
  for (let pass = 0; pass < 3; pass++) {
    let scrollHeight = await page.evaluate('document.body.scrollHeight') as number;
    for (let y = 0; y < scrollHeight; y += 200) {
      await page.evaluate(`window.scrollTo(0, ${y})`);
      await new Promise((r) => setTimeout(r, 150));
    }
    // Extra wait at bottom for carousel to fully load
    await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    await new Promise((r) => setTimeout(r, 1000));
  }

  // Try to trigger carousel navigation to load all images
  await page.evaluate(`
    try {
      var carouselBtns = document.querySelectorAll('[class*="carousel"] button, [class*="next"], [class*="prev"]');
      for (var i = 0; i < Math.min(30, carouselBtns.length); i++) {
        carouselBtns[i].click?.();
      }
    } catch(e) {}
  `);
  await new Promise((r) => setTimeout(r, 2000));

  // Scroll back to top
  await page.evaluate('window.scrollTo(0, 0)');
  // Final wait for all dynamic content
  await new Promise((r) => setTimeout(r, 3000));

  // Try to extract carousel images from iframes
  let iframeCarouselImages: string[] = [];
  const frames = page.frames();
  console.log(`⏳ Found ${frames.length} frames, checking for carousel images in iframes...`);

  for (const frame of frames) {
    try {
      const frameCarouselImages = await frame.evaluate(`(() => {
        var images = [];
        var imgSeen = {};

        // Try to find carousel images in this frame
        document.querySelectorAll('.cycle-carousel-wrap .item[data-thumb]').forEach(function(item) {
          var thumb = item.getAttribute('data-thumb');
          if (thumb && !imgSeen[thumb]) {
            // Normalize URL by extracting base image ID to avoid duplicates with different sizes
            var baseId = thumb.match(/media\\/([^~]*)/)?.[1] || thumb;
            if (!imgSeen[baseId]) {
              imgSeen[thumb] = true;
              imgSeen[baseId] = true;
              images.push(thumb);
            }
          }
        });

        // Also try background images
        document.querySelectorAll('.cycle-carousel-wrap .filler, [class*="carousel"] img').forEach(function(el) {
          var src = el.src || (el.style.backgroundImage ? el.style.backgroundImage.match(/url\\(["']?(.*?)["']?\\)/)?.[1] : null);
          if (src && !imgSeen[src]) {
            var baseId = src.match(/media\\/([^~]*)/)?.[1] || src;
            if (!imgSeen[baseId]) {
              imgSeen[src] = true;
              imgSeen[baseId] = true;
              images.push(src);
            }
          }
        });

        return images;
      })()`) as string[];

      if (frameCarouselImages.length > 0) {
        console.log(`   Found ${frameCarouselImages.length} carousel images in frame: ${frame.url()}`);
        iframeCarouselImages = iframeCarouselImages.concat(frameCarouselImages);
      }
    } catch (e) {
      // Frame might be inaccessible or from different origin
    }
  }

  // Deduplicate carousel images by base URL (remove size/format variations)
  const deduplicatedCarouselImages: string[] = [];
  const carouselImageIds = new Set<string>();
  for (const img of iframeCarouselImages) {
    const baseId = img.match(/media\/([^~]*)/)?.[1] || img;
    if (!carouselImageIds.has(baseId)) {
      carouselImageIds.add(baseId);
      deduplicatedCarouselImages.push(img);
    }
  }
  console.log(`⏳ Deduplicated carousel images: ${iframeCarouselImages.length} → ${deduplicatedCarouselImages.length}`);

  const result = await page.evaluate(`(function() {
    // Debug logging
    var debugInfo = {
      totalImgs: 0,
      carouselImgs: 0,
      carouselWrapFound: false,
      allElements: []
    };

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
    var filterReason = {};

    // Get ALL wixstatic images first (carousel likely has many)
    document.querySelectorAll('img[src*="wixstatic"], img[src*="wix"], img[src*="static.wixstatic"]').forEach(function(img) {
      var src = img.src || img.getAttribute('data-src') || '';
      var parent = img.parentElement ? img.parentElement.className : '';
      if (!src) return;
      if (imgSeen[src]) return;

      // Skip only obvious non-content images
      if (src.indexOf('negishim.com') !== -1 || src.indexOf('linguist-flags') !== -1 || src.indexOf('parastorage') !== -1) return;
      if (src.indexOf('favicon') !== -1) return;

      imgSeen[src] = true;
      images.push(src);
    });

    // Also get images from galleries/carousels with any parent class
    document.querySelectorAll('[data-testid="image"] img, .gallery-item img, wow-image img, .cycle-carousel-wrap img, [class*="carousel"] img, [class*="gallery"] img').forEach(function(img) {
      var src = img.src || img.getAttribute('data-src') || '';
      if (!src || imgSeen[src]) return;
      if (src.indexOf('negishim.com') !== -1 || src.indexOf('linguist-flags') !== -1) return;
      imgSeen[src] = true;
      images.push(src);
    });

    debugInfo.filterReasons = filterReason;

    // Extract carousel images from data-thumb attributes (most reliable)
    document.querySelectorAll('.cycle-carousel-wrap .item[data-thumb]').forEach(function(item) {
      var thumb = item.getAttribute('data-thumb');
      if (thumb && !imgSeen[thumb]) {
        // Extract base image URL without query params to get clean URL
        var cleanUrl = thumb.split('/v1/')[0];
        if (!imgSeen[cleanUrl]) {
          imgSeen[thumb] = true;
          imgSeen[cleanUrl] = true;
          images.push(thumb);
        }
      }
    });

    // Carousel background images as fallback
    document.querySelectorAll('.cycle-carousel-wrap .filler').forEach(function(el) {
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

    // Debug: Check for carousel elements and list ALL images
    debugInfo.totalImgs = document.querySelectorAll('img').length;
    debugInfo.carouselWrapFound = !!document.querySelector('.cycle-carousel-wrap');
    debugInfo.allElements = Array.from(document.querySelectorAll('[class*="carousel"], [class*="gallery"]')).map(function(el) {
      return el.className;
    }).slice(0, 10);

    // List all img src and their parent classes
    debugInfo.allImages = Array.from(document.querySelectorAll('img')).map(function(img) {
      var src = img.src || '';
      var parent = img.parentElement ? img.parentElement.className : '';
      var grandparent = img.parentElement && img.parentElement.parentElement ? img.parentElement.parentElement.className : '';
      return {
        src: src.substring(src.length - 80),
        parentClass: parent.substring(0, 60),
        grandparentClass: grandparent.substring(0, 60)
      };
    });
    console.log('DEBUG INFO:', JSON.stringify(debugInfo, null, 2));

    return {
      title: title,
      content: content || (metaDesc ? '<p>' + metaDesc + '</p>' : ''),
      images: images,
      videos: videos,
      files: files,
      debugInfo: debugInfo
    };
  })()`) as { title: string; content: string; images: string[]; videos: string[]; files: { name: string; ext: string }[] };

  // Add deduplicated iframe carousel images to main results
  // Only use carousel images from iframe, skip social icons from main frame
  if (deduplicatedCarouselImages.length > 0) {
    // Convert thumbnail URLs to full-size versions by removing/modifying size parameters
    const fullSizeImages = deduplicatedCarouselImages.map(url => {
      // Extract base image URL and replace with full-size version
      // Original: https://static.wixstatic.com/media/5eeb4e_xxx~mv2.jpg/v1/fill/w_300,h_300,al_c.../5eeb4e_xxx~mv2.jpg
      // Target:   https://static.wixstatic.com/media/5eeb4e_xxx~mv2.jpg/v1/fill/w_1920,h_1200,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/5eeb4e_xxx~mv2.jpg

      if (url.includes('/v1/fill/')) {
        // Replace sizing parameters with larger dimensions for full-size
        return url.replace(/\/v1\/fill\/[^/]+\//, '/v1/fill/w_1920,h_1200,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/');
      }
      return url;
    });

    result.images = fullSizeImages;
    console.log(`✅ Using ${fullSizeImages.length} unique carousel images from iframes at full-size (skipped thumbnails)`);
  }

  await browser.close();

  // Log debug info
  if ((result as any).debugInfo) {
    console.log(`\n🔍 Debug Info:`);
    console.log(`   Total IMG tags found: ${(result as any).debugInfo.totalImgs}`);
    console.log(`   Carousel wrap found: ${(result as any).debugInfo.carouselWrapFound}`);
    console.log(`   Element classes with 'carousel' or 'gallery': ${(result as any).debugInfo.allElements.join(', ')}`);
    console.log(`\n📸 All ${(result as any).debugInfo.totalImgs} images found:`);
    (result as any).debugInfo.allImages.forEach((img: any, i: number) => {
      console.log(`   ${i + 1}. Parent: [${img.parentClass}] | Grandparent: [${img.grandparentClass}]`);
      console.log(`      → ${img.src}`);
    });
    console.log(`\n⚠️ Filtered images and reasons:`);
    Object.entries((result as any).debugInfo.filterReasons).forEach(([src, reason]: [string, any]) => {
      if (src) {
        const srcShort = src.substring(src.length - 60);
        console.log(`   - [${reason}] ${srcShort}`);
      }
    });
  }

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
