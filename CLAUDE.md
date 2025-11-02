# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal blog and portfolio website built with Astro 5, using TypeScript and Tailwind CSS 4. The site is a customized version of the AstroPaper theme, featuring blog posts, tags, archives, search functionality, and dynamic OG image generation.

## Development Commands

- **Dev server**: `npm run dev` - Start Astro dev server with hot reload
- **Build**: `npm run build` - Runs type checking, builds the site, generates Pagefind search index, and copies it to public/
- **Preview**: `npm run preview` - Preview production build locally
- **Format**: `npm run format` - Format code with Prettier
- **Format check**: `npm run format:check` - Check formatting without changes
- **Lint**: `npm run lint` - Run ESLint
- **Type check**: `astro check` - Run Astro's TypeScript checker

## Architecture

### Content Management

- **Blog posts**: Located in `src/data/blog/` as markdown files with frontmatter
- **Content schema**: Defined in `src/content.config.ts` using Astro's content collections
- **Schema fields**: author, pubDatetime, modDatetime, title, featured, draft, tags, ogImage, description, canonicalURL, hideEditPost, timezone
- **Content loader**: Uses Astro's glob loader to load all non-underscore-prefixed markdown files from `src/data/blog/`

### Configuration

- **Site config**: `src/config.ts` exports `SITE` object with global settings (website URL, author, timezone, pagination, etc.)
- **Social links**: `src/constants.ts` exports `SOCIALS` and `SHARE_LINKS` arrays
- **Path aliases**: TypeScript paths configured with `@/*` mapping to `./src/*`

### Routing & Pages

- **Homepage**: `src/pages/index.astro` - Shows featured/recent posts
- **Post listing**: `src/pages/posts/[...page].astro` - Paginated post list
- **Post detail**: `src/pages/posts/[...slug]/index.astro` - Individual post pages
- **Tags**: `src/pages/tags/[tag]/[...page].astro` - Posts filtered by tag
- **Archives**: `src/pages/archives/index.astro` - Chronological post list
- **Search**: `src/pages/search.astro` - Powered by Pagefind
- **RSS**: `src/pages/rss.xml.ts` - RSS feed generation
- **OG Images**: `src/pages/og.png.ts` (site) and `src/pages/posts/[...slug]/index.png.ts` (posts)

### Layouts

- **Layout.astro**: Base HTML layout with head tags, meta, theme toggle
- **Main.astro**: Main content wrapper with header/footer
- **PostDetails.astro**: Post detail page layout with metadata, share links, back button
- **AboutLayout.astro**: About page layout

### Utilities

- **Post filtering/sorting**: `src/utils/` contains utilities for:
  - `getSortedPosts.ts` - Sort posts by date
  - `postFilter.ts` - Filter published posts based on draft status and scheduled dates
  - `getPostsByTag.ts` - Filter posts by tag
  - `getUniqueTags.ts` - Extract unique tags from posts
  - `getPostsByGroupCondition.ts` - Group posts by custom conditions
  - `slugify.ts` - Convert strings to URL-safe slugs

### OG Image Generation

- Dynamic OG images generated using Satori (SVG-based) and @resvg/resvg-js (SVG to PNG conversion)
- Templates in `src/utils/og-templates/` (post.ts and site.ts)
- `src/utils/generateOgImages.ts` handles conversion
- `src/utils/loadGoogleFont.ts` loads fonts for Satori rendering

### Search

- Pagefind integration for static site search
- Build step generates search index: `pagefind --site dist`
- Search index copied to `public/pagefind/` after build
- Search UI at `/search` page

### Styling

- Tailwind CSS 4 configured via `@tailwindcss/vite` plugin
- Typography plugin enabled for markdown content
- Light/dark mode support with theme toggle
- Custom code syntax highlighting using Shiki (themes: min-light and night-owl)
- Custom Shiki transformers in `src/utils/transformers/` for filename labels, highlighting, and diff notation

### Markdown

- Remark plugins: `remark-toc` (table of contents) and `remark-collapse` (collapsible sections)
- Shiki transformers: notation highlighting, word highlighting, diff notation, and custom filename transformer

## Important Notes

- Posts with `draft: true` or future `pubDatetime` are filtered out in production
- Timezone handling: Default timezone is `America/Chicago`, can be overridden per-post
- Edit post links can be enabled in `src/config.ts` (currently disabled)
- Archives page visibility controlled by `SITE.showArchives`
- Image optimization configured with responsive styles and constrained layout
- TypeScript strict mode enabled via Astro's strict tsconfig
