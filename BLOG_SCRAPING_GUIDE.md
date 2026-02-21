# Blog Scraping Guide

## Overview

The blog scraping has been updated to work differently from the previous approach. Instead of scraping individual blog posts directly by URL, the new system:

1. **Discovers** blog posts from the main blog listing page
2. **Scrapes** each individual blog post, focusing on the main content only
3. **Ignores** related posts and navigation elements at the bottom

## Key Changes

### 1. New Discovery Script: `scrape-blog-listing.ts`
- Visits https://www.bialystokvicinityexpatsisrael.org.il/blog
- Scrolls through the page to load all blog posts
- Extracts links to individual blog posts
- Saves discovered posts to `blog-posts-discovered.json`

**Usage:**
```bash
npx tsx scripts/scrape-blog-listing.ts
```

### 2. New Combined Script: `scrape-blog-posts.ts` (Recommended)
- Discovers all blog posts from the listing page
- Automatically scrapes each one
- No manual configuration needed

**Usage:**
```bash
npx tsx scripts/scrape-blog-posts.ts
```

### 3. Updated `scrape-page.ts`
Enhanced to detect blog post pages and handle them differently:

#### For Blog Posts (`/post/` URLs):
- **Content extraction**: Only extracts from the main `[data-hook="post-description"]` area
- **Image extraction**: Only gets images from inside the post content, not from related posts
- **Scrolling**: Minimal scrolling to avoid loading related posts carousel
- **Related posts**: Completely ignored (no carousel image scraping)

#### For Other Pages:
- Uses the original aggressive scraping approach
- Includes carousel and gallery image extraction
- Multiple fallback methods for content extraction

### 4. Main Differences from Old Approach

| Aspect | Old | New |
|--------|-----|-----|
| **Discovery** | Manual blog posts list | Automatic from listing page |
| **Main Content** | Extracted from anywhere | Only from post description area |
| **Related Posts** | Images included (cluttered) | Images ignored |
| **Page Scrolling** | Aggressive (loads everything) | Smart (focuses on content) |
| **Files & Links** | Extracted | Extracted |

## How It Works

### The New Workflow

1. **Start**: User runs `scrape-blog-posts.ts`

2. **Discovery Phase**:
   - Opens https://www.bialystokvicinityexpatsisrael.org.il/blog
   - Scrolls through to load all posts
   - Finds all links with `/post/` in the URL
   - Creates a list with: URL, title, and generated ID

3. **Scraping Phase** (for each blog post):
   - Opens the blog post URL
   - Detects it's a blog post (by `/post/` in URL)
   - Scrolls minimally to load main content only
   - Extracts:
     - Title from `[data-hook="blog-post-title"]`
     - Content from `[data-hook="post-description"]`
     - Images from inside the post description area only
     - Videos (YouTube embeds)
     - Files (PDF, MP4, etc.)
   - Ignores the related posts section at bottom
   - Downloads images locally
   - Saves to `data/posts/<post-id>.json`

## Image Extraction Strategy

### Blog Posts
- **Only** extracts images from the post content area
- Ignores all related posts carousel images
- Filters out:
  - Social media icons
  - Language flags
  - Accessibility buttons
  - Navigation elements
  - Very small images (< 100x100)

### Other Content Pages
- Extracts images from carousels and galleries
- Supports multiple image sources
- First 3 images used as content images

## Files & Directory Structure

```
scripts/
├── scrape-blog-listing.ts     # Discover blog posts from listing page
├── scrape-blog-posts.ts       # Main script (discovery + scraping)
├── scrape-page.ts             # Enhanced page scraper (handles blog posts)
├── scrape-all-blog-posts.ts   # (Old) - No longer needed
└── blog-posts.json            # (Old) - Replaced by auto-discovery

data/posts/
├── eva-kartzovska.json        # Blog post data
├── michael-flicker.json       # Blog post data
└── ...

public/images/migrated/
├── eva-kartzovska/            # Images for blog post
│   ├── eva-kartzovska-1.jpg
│   ├── eva-kartzovska-2.jpg
│   └── eva-kartzovska-3.jpg
└── ...
```

## Running the Scraper

### Option 1: Full Discovery + Scraping (Recommended)
```bash
npx tsx scripts/scrape-blog-posts.ts
```

This will:
- Discover all blog posts from the listing page
- Scrape each one
- Save everything to `data/posts/`

### Option 2: Just Discover Blog Posts
```bash
npx tsx scripts/scrape-blog-listing.ts
```

This will save discovered posts to `blog-posts-discovered.json`

### Option 3: Scrape a Single Blog Post
```bash
npx tsx scripts/scrape-page.ts "https://www.bialystokvicinityexpatsisrael.org.il/post/eva-kartzovska" "eva-kartzovska"
```

## What Gets Saved

Each blog post JSON file contains:

```json
{
  "id": "eva-kartzovska",
  "slug": "eva-kartzovska",
  "title": { "he": "אווה קרצובסקה", "en": "" },
  "category": "survivors",
  "date": "2026-02-12",
  "author": "migrated",
  "excerpt": { "he": "אווה קרצובסקה", "en": "" },
  "content": { "he": "<p>Blog post content HTML...</p>", "en": "" },
  "images": ["/images/migrated/eva-kartzovska/eva-kartzovska-1.jpg"],
  "videos": [],
  "files": [],
  "parentPage": "survivor-stories",
  "imageDisplayMode": "gallery"
}
```

## Handling Content Correctly

### Blog Post Content is Focused
- ✅ Main text content from the blog post
- ✅ Embedded images within the post
- ✅ Files attached to the post
- ✅ Links in the post
- ❌ Related posts images (at bottom)
- ❌ Navigation elements
- ❌ Social icons

### Images Stored Locally
- Downloaded to `public/images/migrated/{post-id}/`
- Referenced with paths like `/images/migrated/eva-kartzovska/eva-kartzovska-1.jpg`
- Original wixstatic URLs are replaced with local paths

## Troubleshooting

### No Blog Posts Found
If the scraper finds 0 blog posts:
1. Check the blog listing page loads correctly
2. The HTML structure may have changed
3. Blog post links might use a different URL pattern than `/post/`

### Missing Images
If blog post images aren't captured:
1. They might be in the related posts section (now correctly ignored)
2. Check if they're inside the post description area
3. Very small images are intentionally filtered out

### Content is Empty
If blog post content is empty:
1. The post description area might use different selectors
2. Manual content entry may be needed
3. Check the scraper debug output for information

## Future Improvements

- [ ] Add support for different blog post content selectors
- [ ] Extract post metadata (date, author)
- [ ] Handle embedded media better
- [ ] Support pagination on blog listing page
- [ ] Cache discovered blog posts to avoid re-scraping

## Debug Output

Run the scraper with debug logging to see:
- Which frame/element the content was extracted from
- All images found and why they were filtered
- Content extraction process

```bash
npx tsx scripts/scrape-blog-posts.ts 2>&1 | tee scraper-debug.log
```
