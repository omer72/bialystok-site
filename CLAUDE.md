# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Website for the Organization of Bialystok and Vicinity Expats in Israel. Bilingual (Hebrew/English) site with a JSON file-based CMS and admin panel. Deployed on Netlify (frontend) with a separate Express API server.

## Commands

- `npm run dev` — Start both Vite dev server (port 3000) and Express API (port 4002) via concurrently
- `npm run dev:client` — Vite frontend only
- `npm run dev:server` — Express API only (uses `tsx watch`)
- `npm run build` — Vite production build to `dist/`
- `npm run start` — Run production server (`tsx server/index.ts`)

No test framework or linter is configured.

## Architecture

**Frontend:** React 18 + React Router + Vite + TypeScript. Entry at `src/main.tsx` → `App.tsx`. Vite proxies `/api` to the Express server in dev.

**Server:** Express API at `server/index.ts`. Routes in `server/routes/admin.ts` (page/post CRUD + auth) and `server/routes/upload.ts` (image upload via Multer). JWT auth middleware in `server/middleware/auth.ts`.

**Data layer:** No database. Content stored as JSON files:
- `data/pages.json` — Page definitions and nav menu order
- `data/posts/*.json` — Individual content posts (each file is one post)
- `data/site-config.json` — Site title, contact info, social links

**Two TypeScript configs:** `tsconfig.json` (frontend, `src/`) and `tsconfig.server.json` (server, `server/`).

## Key Patterns

- **Bilingual content:** All user-facing text uses `{ "he": "...", "en": "..." }` objects. UI strings in `src/i18n/he.json` and `src/i18n/en.json` via react-i18next. Default language is Hebrew.
- **RTL-first styling:** CSS is written RTL-first with Hebrew as the primary language. CSS variables defined in `src/styles/variables.css`.
- **Routing:** Post list pages (`/blog`, `/people`, `/events`, `/news`) share `PostListPage` component; detail pages share `PostDetailPage`. Static content pages use `ContentPage`. Category is derived from the URL path.
- **Admin panel:** Accessed at `/admin`, protected by `AdminRoute` wrapper that checks JWT. Two editors: `AdminPageEditor` (pages with nav entry) and `AdminPostEditor` (standalone posts).
- **Image uploads:** Saved to `public/images/posts/`, served statically by Express at `/images`.

## Environment Variables

Defined in `.env` at project root:
- `ADMIN_PASSWORD` — Admin login password
- `JWT_SECRET` — JWT signing secret
- `PORT` — Express server port (default 4002)
- `VITE_SITE_TITLE` — Site title (exposed to frontend via Vite)
- `CORS_ORIGIN` — Optional additional allowed CORS origin
