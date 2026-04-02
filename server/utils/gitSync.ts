import { exec } from 'child_process';

let syncing = false;
const queue: Array<{ message: string; resolve: () => void; reject: (err: Error) => void }> = [];

function run(cmd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd: process.cwd(), timeout: 30000 }, (err, stdout, stderr) => {
      if (err) reject(new Error(`${cmd} failed: ${stderr || err.message}`));
      else resolve(stdout.trim());
    });
  });
}

async function processQueue() {
  if (syncing || queue.length === 0) return;
  syncing = true;

  // Batch all queued changes into a single commit
  const items = queue.splice(0);
  const messages = [...new Set(items.map((i) => i.message))];
  const commitMsg = messages.join('; ');

  try {
    // Configure git identity if not set (needed on Render)
    await run('git config user.email "admin@bialystok-site.org" 2>/dev/null || true');
    await run('git config user.name "Site Admin" 2>/dev/null || true');

    // Stage data and uploaded files
    await run('git add data/ public/files/ public/images/posts/');

    // Check if there are staged changes
    try {
      await run('git diff --cached --quiet');
      // No changes — resolve all
      items.forEach((i) => i.resolve());
      syncing = false;
      processQueue();
      return;
    } catch {
      // There are changes — continue to commit
    }

    await run(`git commit -m "[auto] ${commitMsg}"`);

    // Push using token-based URL if configured
    const token = process.env.GIT_TOKEN;
    const repo = process.env.GIT_REPO; // e.g. omer72/bialystok-site
    if (token && repo) {
      await run(`git push https://${token}@github.com/${repo}.git HEAD:main`);
    } else {
      await run('git push');
    }

    console.log(`[gitSync] Pushed: ${commitMsg}`);
    items.forEach((i) => i.resolve());
  } catch (err) {
    console.error('[gitSync] Failed:', err);
    // Don't block the API — resolve anyway so the user sees their changes
    items.forEach((i) => i.resolve());
  }

  syncing = false;
  processQueue();
}

export function gitSync(message: string): Promise<void> {
  return new Promise((resolve, reject) => {
    queue.push({ message, resolve, reject });
    // Small delay to batch rapid changes (e.g. create + upload)
    setTimeout(() => processQueue(), 2000);
  });
}
