# Bialystok Site

**ארגון יוצאי ביאליסטוק והסביבה בישראל — אתר הבית**

Modern website for the Organization of Bialystok and Vicinity Expats in Israel. Built with React + Vite, featuring a built-in admin CMS for content management.

## Tech Stack

- **Frontend:** React 18, React Router, Vite, TypeScript
- **Server:** Express, Multer (image uploads), JWT auth
- **i18n:** react-i18next (Hebrew + English)
- **Data:** JSON file-based CMS (no database required)
- **Styling:** CSS custom properties, RTL-first, responsive

## Quick Start

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your values

# Run development (frontend + server)
npm run dev
```

The site opens at **http://localhost:3000** and the API runs on **http://localhost:4002**.

## Environment Variables

Create a `.env` file in the project root:

```env
ADMIN_PASSWORD=your-admin-password
VITE_SITE_TITLE=ארגון יוצאי ביאליסטוק והסביבה בישראל
JWT_SECRET=your-jwt-secret-change-in-production
PORT=4002
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start both Vite dev server and Express API |
| `npm run dev:client` | Start only the Vite frontend |
| `npm run dev:server` | Start only the Express API server |
| `npm run build` | Build the frontend for production |
| `npm run preview` | Preview the production build |

## Project Structure

```
bialystok-site/
├── data/                         # JSON content (the CMS)
│   ├── pages.json                # Page definitions + nav menu order
│   ├── posts/                    # Individual content posts
│   └── site-config.json          # Site title, contact info, social links
├── public/images/                # Uploaded images
├── server/                       # Express API
│   ├── index.ts                  # Server entry point
│   ├── routes/
│   │   ├── admin.ts              # Auth + page CRUD routes
│   │   └── upload.ts             # Image upload endpoint
│   └── middleware/
│       └── auth.ts               # JWT authentication
└── src/                          # React frontend
    ├── admin/                    # Admin panel components
    │   ├── AdminLogin.tsx
    │   ├── AdminDashboard.tsx
    │   └── AdminPageEditor.tsx
    ├── components/               # Shared UI components
    │   ├── Navbar.tsx            # Dynamic nav from pages.json
    │   ├── Footer.tsx
    │   ├── HeroSection.tsx
    │   ├── YouTubeEmbed.tsx
    │   ├── PostCard.tsx
    │   ├── ImageGallery.tsx
    │   ├── ContactForm.tsx
    │   └── GoogleMap.tsx
    ├── pages/                    # Page components
    │   ├── HomePage.tsx
    │   ├── ContentPage.tsx       # Generic content renderer
    │   ├── PostListPage.tsx      # Blog/card list
    │   ├── PostDetailPage.tsx
    │   └── ContactPage.tsx
    ├── i18n/                     # Hebrew + English translations
    ├── hooks/                    # usePages, useLanguage
    └── styles/                   # CSS (global + variables)
```

## Admin Panel

Access the admin at **/admin** and enter the password from your `.env` file.

### Features

- **Create pages** — add title (Hebrew + English), content, category
- **YouTube videos** — paste a URL, it auto-embeds with preview
- **Image upload** — upload images that are saved to `public/images/posts/`
- **Navigation control** — check "Add to navigation" to auto-add pages to the menu
- **Edit / Delete** — manage all existing pages from the dashboard

### Content Categories

| Category | Description |
|----------|-------------|
| `survivors` | Survivor stories (shown under /blog) |
| `people` | Famous people from Bialystok (/people) |
| `events` | Memorial ceremonies and events (/events) |
| `news` | Community news (/news) |
| `content` | General static pages |

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/admin/login` | No | Login with password, returns JWT |
| `GET` | `/api/pages` | No | Get all page definitions |
| `GET` | `/api/posts?category=` | No | Get posts, optionally filtered |
| `GET` | `/api/posts/:id` | No | Get single post by ID |
| `GET` | `/api/posts/by-slug/:slug` | No | Get single post by slug |
| `POST` | `/api/pages` | JWT | Create new page + post |
| `PUT` | `/api/pages/:id` | JWT | Update page + post |
| `DELETE` | `/api/pages/:id` | JWT | Delete page + post |
| `POST` | `/api/upload` | JWT | Upload image (multipart) |
| `POST` | `/api/contact` | No | Submit contact form |

## Bilingual Support

The site supports **Hebrew** (RTL) and **English** (LTR):

- UI strings are in `src/i18n/he.json` and `src/i18n/en.json`
- Content is stored with `{ "he": "...", "en": "..." }` in JSON files
- Language switcher in the navbar toggles between languages
- Default language is Hebrew

## Adding Content via JSON

To add content directly (without the admin panel), create a JSON file in `data/posts/`:

```json
{
  "id": "my-page",
  "slug": "my-page",
  "title": { "he": "העמוד שלי", "en": "My Page" },
  "category": "content",
  "date": "2025-01-01",
  "author": "admin",
  "excerpt": { "he": "תקציר...", "en": "Excerpt..." },
  "content": { "he": "<p>תוכן בעברית</p>", "en": "<p>English content</p>" },
  "images": [],
  "videos": ["https://www.youtube.com/watch?v=..."],
  "parentPage": ""
}
```

Then add a corresponding entry to `data/pages.json` to make it appear in navigation.

## License

All rights reserved. Created by Omer Etrog.
