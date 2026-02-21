# PDF Files & Media Support Guide

## Overview

Blog posts and content pages support embedding PDF files, videos, and other media attachments. PDFs are displayed with an embedded viewer on the page, while other formats can be embedded or provided as downloads.

## File Structure

Files should be organized in the `public/files/migrated/` directory by post slug:

```
public/files/
├── migrated/
│   ├── post-slug-1/
│   │   ├── document-1.pdf
│   │   ├── document-2.pdf
│   │   └── video.mp4
│   └── post-slug-2/
│       └── interview.pdf
```

## Adding Files to a Blog Post

### 1. Place PDF Files in the Correct Location

Create a folder matching your post's slug in `public/files/migrated/`:

```bash
mkdir -p public/files/migrated/mina-kizelstein-doron
# Copy your PDF files there
cp ~/Downloads/document.pdf public/files/migrated/mina-kizelstein-doron/
```

### 2. Update the Post JSON

Add a `files` array to your blog post JSON file in `data/posts/`:

```json
{
  "id": "mina-kizelstein-doron",
  "slug": "mina-kizelstein-doron",
  "title": { "he": "מינה קיזלשטיין-דורון", "en": "" },
  "category": "survivors",
  "date": "2026-02-21",
  "author": "migrated",
  "content": { "he": "...", "en": "" },
  "images": ["..."],
  "videos": [],
  "files": [
    {
      "name": "מינה דורן.pdf",
      "path": "/files/migrated/mina-kizelstein-doron/מינה דורן.pdf"
    },
    {
      "name": "Interview - Mina Doron",
      "path": "/files/migrated/mina-kizelstein-doron/interview.mp4"
    }
  ],
  "parentPage": "survivor-stories",
  "imageDisplayMode": "gallery"
}
```

## Supported File Types

| File Type | Display Method | Usage |
|-----------|---|---|
| `.pdf` | Embedded PDF viewer + download link | Documents, testimony records, archives |
| `.mp4` | HTML5 video player with controls | Video interviews, testimonies |
| `.webm`, `.ogg` | HTML5 video player with controls | Video (alternative formats) |
| Other files | Download link only | Audio, text, images, etc. |
| No path | Pending message | Placeholder for files being added |

## Display Examples

### PDF Display
- Shows as embedded viewer (600px height)
- Includes download link below
- Users can view inline or download the file

### Video Display
- Shows as HTML5 video player with controls
- Full width, responsive height
- Supports standard video formats

### Other Files
- Shows as text link with download option
- Shows file name as clickable link
- Opens in new tab or downloads

### Pending Files
- Shows file name with "Coming soon" message
- Used when file is being processed
- Remove the message when file path is added

## Example with Pending Files

If you want to add a file but don't have it yet, use this format:

```json
"files": [
  {
    "name": "Full Biography Document"
  }
]
```

This will display with a "File pending - coming soon" message. Once you have the file:

```json
"files": [
  {
    "name": "Full Biography Document",
    "path": "/files/migrated/my-post-slug/biography.pdf"
  }
]
```

## Git Configuration

The `.gitignore` file has been configured to allow PDF and media files:

```
!public/files/**
!public/files/migrated/**/*.pdf
!public/files/migrated/**/*.mp4
!public/files/migrated/**/*.webm
```

All files in `public/files/migrated/` will be tracked by Git.

## Workflow Example

1. **Place File**: `cp testimony.pdf public/files/migrated/post-slug/`
2. **Update JSON**: Add file entry to `data/posts/post-slug.json`
3. **Commit**: `git add public/files/ data/posts/post-slug.json && git commit -m "Add PDF files for post-slug"`
4. **Push**: `git push origin main`
5. **View**: Website will display the PDF viewer automatically

## Styling & Customization

PDF viewers use standard iframe styling. To customize appearance, edit styles in `src/styles/` for the `.file-preview` and `.file-download` classes.

Current default styles:
- PDF viewer height: 600px
- Border radius: 8px
- Full width responsive

## Notes

- File paths should use forward slashes `/` even on Windows
- Hebrew filenames are supported (use UTF-8 encoding)
- Large PDF files may take longer to load
- PDFs are embedded using iframe - ensure browser compatibility
- Video files should be optimized for web (H.264 video codec, AAC audio)
