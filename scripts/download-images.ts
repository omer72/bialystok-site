/**
 * Download images from Wix CDN and update post JSON files with local paths.
 *
 * Usage:
 *   npx tsx scripts/download-images.ts
 *
 * Run this AFTER migrate-wix-content.ts has scraped the pages.
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
        // Handle redirects
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

async function main() {
  ensureDir(IMAGES_DIR);

  const postFiles = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.json'));
  let totalDownloaded = 0;
  let totalFailed = 0;

  for (const file of postFiles) {
    const filePath = path.join(POSTS_DIR, file);
    const post = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    if (!post.images || post.images.length === 0) continue;

    console.log(`\n📄 Processing: ${post.id} (${post.images.length} images)`);

    const postImageDir = path.join(IMAGES_DIR, post.id);
    ensureDir(postImageDir);

    const updatedImages: string[] = [];

    for (let i = 0; i < post.images.length; i++) {
      const imgUrl = post.images[i];

      // Skip if already a local path
      if (!imgUrl.startsWith('http')) {
        updatedImages.push(imgUrl);
        continue;
      }

      const ext = getExtensionFromUrl(imgUrl);
      const filename = `${post.id}-${i + 1}${ext}`;
      const destPath = path.join(postImageDir, filename);
      const localPath = `/images/migrated/${post.id}/${filename}`;

      try {
        console.log(`   ⬇️  Downloading image ${i + 1}/${post.images.length}...`);
        await downloadFile(imgUrl, destPath);
        updatedImages.push(localPath);
        totalDownloaded++;
        console.log(`   ✅ Saved: ${filename}`);
      } catch (err) {
        console.error(`   ❌ Failed: ${imgUrl}`);
        // Keep original URL as fallback
        updatedImages.push(imgUrl);
        totalFailed++;
      }
    }

    // Update the post file with local image paths
    post.images = updatedImages;
    fs.writeFileSync(filePath, JSON.stringify(post, null, 2), 'utf-8');
    console.log(`   💾 Updated: ${file}`);
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 Image Download Summary:`);
  console.log(`   ✅ Downloaded: ${totalDownloaded}`);
  console.log(`   ❌ Failed: ${totalFailed}`);
  console.log(`   📁 Images saved to: ${IMAGES_DIR}`);
  console.log('='.repeat(50));
}

main().catch(console.error);
