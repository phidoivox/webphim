---
name: seo-and-schema
description: Use when implementing SEO metadata, OpenGraph tags, Twitter cards, VideoObject structured data (JSON-LD), or sitemaps
---

# SEO & Schema Markup (Structured Data)

## Overview
Guidelines for maximizing search engine visibility, rich snippets, social sharing cards, and Google Video indexing.

## Next.js Dynamic Metadata Example
```typescript
import type { Metadata } from 'next';

export async function generateMetadata({ params }): Promise<Metadata> {
  const movie = await getMovie(params.slug);
  return {
    title: `${movie.title} - Xem Phim Full HD`,
    description: movie.synopsis,
    openGraph: {
      title: movie.title,
      description: movie.synopsis,
      images: [{ url: movie.poster_url }],
      type: 'video.movie',
    },
  };
}
```

## JSON-LD VideoObject Schema
Always inject structured data for video detail pages:
```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: movie.title,
      description: movie.synopsis,
      thumbnailUrl: [movie.poster_url],
      uploadDate: movie.created_at,
      contentUrl: movie.stream_url,
    }),
  }}
/>
```
