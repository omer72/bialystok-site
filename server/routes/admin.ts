import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { verifyAdmin, generateToken } from '../middleware/auth.js';

const router = Router();

const DATA_DIR = path.join(process.cwd(), 'data');
const PAGES_FILE = path.join(DATA_DIR, 'pages.json');
const POSTS_DIR = path.join(DATA_DIR, 'posts');

// Helper to read JSON
function readJson(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

// Helper to write JSON
function writeJson(filePath: string, data: unknown) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Login
router.post('/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    const token = generateToken();
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Wrong password' });
  }
});

// Get all pages
router.get('/pages', (_req, res) => {
  try {
    const pages = readJson(PAGES_FILE);
    res.json(pages);
  } catch {
    res.status(500).json({ error: 'Failed to read pages' });
  }
});

// Get posts by category
router.get('/posts', (req, res) => {
  try {
    const category = req.query.category as string;
    const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.json'));
    let posts = files.map((f) => readJson(path.join(POSTS_DIR, f)));

    if (category) {
      posts = posts.filter((p: { category: string }) => p.category === category);
    }

    // Sort by date, newest first
    posts.sort((a: { date: string }, b: { date: string }) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    res.json(posts);
  } catch {
    res.json([]);
  }
});

// Get all posts for admin (no category filter)
router.get('/admin/posts', verifyAdmin, (_req, res) => {
  try {
    const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.json'));
    const posts = files.map((f) => readJson(path.join(POSTS_DIR, f)));
    posts.sort((a: { date: string }, b: { date: string }) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    res.json(posts);
  } catch {
    res.json([]);
  }
});

// Create a new post only (admin only)
router.post('/admin/posts', verifyAdmin, (req, res) => {
  try {
    const postData = req.body;
    const postFile = path.join(POSTS_DIR, `${postData.slug || postData.id}.json`);
    writeJson(postFile, postData);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Update a single post (admin only)
router.put('/admin/posts/:id', verifyAdmin, (req, res) => {
  try {
    const postData = req.body;
    const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.json'));
    for (const f of files) {
      const post = readJson(path.join(POSTS_DIR, f));
      if (post.id === req.params.id) {
        writeJson(path.join(POSTS_DIR, f), { ...post, ...postData });
        return res.json({ success: true });
      }
    }
    // If not found, create new
    const postFile = path.join(POSTS_DIR, `${postData.slug || postData.id || req.params.id}.json`);
    writeJson(postFile, postData);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// Delete a single post (admin only)
router.delete('/admin/posts/:id', verifyAdmin, (req, res) => {
  try {
    const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.json'));
    for (const f of files) {
      const post = readJson(path.join(POSTS_DIR, f));
      if (post.id === req.params.id) {
        fs.unlinkSync(path.join(POSTS_DIR, f));
        return res.json({ success: true });
      }
    }
    res.status(404).json({ error: 'Post not found' });
  } catch {
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Get single post by ID
router.get('/posts/:id', (req, res) => {
  try {
    const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.json'));
    for (const f of files) {
      const post = readJson(path.join(POSTS_DIR, f));
      if (post.id === req.params.id) {
        return res.json(post);
      }
    }
    res.status(404).json({ error: 'Post not found' });
  } catch {
    res.status(500).json({ error: 'Failed to read post' });
  }
});

// Get single post by slug
router.get('/posts/by-slug/:slug', (req, res) => {
  try {
    const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.json'));
    for (const f of files) {
      const post = readJson(path.join(POSTS_DIR, f));
      if (post.slug === req.params.slug) {
        return res.json(post);
      }
    }
    res.status(404).json({ error: 'Post not found' });
  } catch {
    res.status(500).json({ error: 'Failed to read post' });
  }
});

// Create new page/post (admin only)
router.post('/pages', verifyAdmin, (req, res) => {
  try {
    const pages = readJson(PAGES_FILE);
    const { pageData, postData } = req.body;

    // Add to pages.json
    pages.push(pageData);
    writeJson(PAGES_FILE, pages);

    // Create post file
    if (postData) {
      const postFile = path.join(POSTS_DIR, `${postData.slug || postData.id}.json`);
      writeJson(postFile, postData);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create page' });
  }
});

// Update page/post (admin only)
router.put('/pages/:id', verifyAdmin, (req, res) => {
  try {
    const pages = readJson(PAGES_FILE);
    const { pageData, postData } = req.body;
    const idx = pages.findIndex((p: { id: string }) => p.id === req.params.id);

    if (idx !== -1 && pageData) {
      pages[idx] = { ...pages[idx], ...pageData };
      writeJson(PAGES_FILE, pages);
    }

    if (postData) {
      let found = false;
      const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.json'));
      for (const f of files) {
        const post = readJson(path.join(POSTS_DIR, f));
        if (post.id === req.params.id) {
          writeJson(path.join(POSTS_DIR, f), { ...post, ...postData });
          found = true;
          break;
        }
      }
      // If no existing post file, create one
      if (!found) {
        const postFile = path.join(POSTS_DIR, `${postData.slug || postData.id || req.params.id}.json`);
        writeJson(postFile, postData);
      }
    }

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to update' });
  }
});

// Delete page/post (admin only)
router.delete('/pages/:id', verifyAdmin, (req, res) => {
  try {
    let pages = readJson(PAGES_FILE);
    pages = pages.filter((p: { id: string }) => p.id !== req.params.id);
    writeJson(PAGES_FILE, pages);

    // Remove post file
    const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.json'));
    for (const f of files) {
      const post = readJson(path.join(POSTS_DIR, f));
      if (post.id === req.params.id) {
        fs.unlinkSync(path.join(POSTS_DIR, f));
        break;
      }
    }

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

export { router as adminRouter };
