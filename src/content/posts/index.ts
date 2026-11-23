import type { ComponentType } from 'react';

import { baseLocale } from '@/paraglide/runtime.js';

/**
 * Local blog posts written as MDX files in this directory.
 * File naming: `<slug>.<locale>.mdx` (falls back to the base locale).
 * Register every local post slug here — it drives loading and the sitemap.
 *
 * This module is isomorphic (safe in client bundles). Database posts are
 * fetched through the server functions in ./server.ts and merged with the
 * local posts via the pure helpers below.
 */
// Template articles stay in source as examples; publish only product content here.
export const BLOG_POST_SLUGS: readonly string[] = [
  'vikas-editor-eagle-photo-edit',
  'jatayu-ai-video-prompt',
];

export type BlogPostMeta = {
  title: string;
  description: string;
  created_at: string;
  author_name?: string;
  author_image?: string;
  image?: string;
  /** Limit publication to languages actually provided by the article. */
  locales?: readonly string[];
  image_alt?: string;
  image_caption?: string;
  image_width?: number;
  image_height?: number;
};

type PostModule = {
  default: ComponentType;
  meta: BlogPostMeta;
};

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  image?: string;
  locales?: readonly string[];
  imageAlt?: string;
  imageCaption?: string;
  imageWidth?: number;
  imageHeight?: number;
  /** ISO date string — serializable across loader/server-fn boundaries */
  createdAt: string;
  authorName?: string;
  authorImage?: string;
  source: 'local' | 'db';
  /** A paid guest post: shown with a Sponsored label, links rel="sponsored". */
  sponsored?: boolean;
};

export type BlogPostDetail = BlogPost & {
  /** Raw markdown — set for database posts */
  content?: string;
  /** An unpublished guest post shown to its author or a reviewer. */
  preview?: boolean;
  /** Preview only: where the submission stands, for the banner's next step. */
  previewInfo?: {
    guestPostId: string;
    status: string;
    isAuthor: boolean;
    /** Package price, formatted on the client. */
    priceInCents: number;
    currency: string;
    /** Submit rules, checked before checkout. */
    minWords: number;
    maxLinks: number;
  };
};

// Eagerly bundle the local MDX posts (small markdown files), mirroring the
// static-pages pattern. Keys are absolute from the project root.
const postModules = import.meta.glob<PostModule>('/src/content/posts/*.mdx', {
  eager: true,
});

export function loadLocalPost(slug: string, locale: string): PostModule | null {
  if (!BLOG_POST_SLUGS.includes(slug as (typeof BLOG_POST_SLUGS)[number])) {
    return null;
  }
  const mod =
    postModules[`/src/content/posts/${slug}.${locale}.mdx`] ??
    postModules[`/src/content/posts/${slug}.${baseLocale}.mdx`] ??
    null;
  return mod?.meta.locales && !mod.meta.locales.includes(locale) ? null : mod;
}

function localPostToItem(slug: string, meta: BlogPostMeta): BlogPost {
  return {
    slug,
    title: meta.title,
    description: meta.description,
    image: meta.image,
    locales: meta.locales,
    imageAlt: meta.image_alt,
    imageCaption: meta.image_caption,
    imageWidth: meta.image_width,
    imageHeight: meta.image_height,
    createdAt: new Date(meta.created_at).toISOString(),
    authorName: meta.author_name,
    authorImage: meta.author_image,
    source: 'local',
  };
}

export function getLocalPosts(locale: string): BlogPost[] {
  return BLOG_POST_SLUGS.map((slug) => ({
    slug: slug as string,
    mod: loadLocalPost(slug, locale),
  }))
    .filter((m): m is { slug: string; mod: PostModule } => m.mod !== null)
    .map(({ slug, mod }) => localPostToItem(slug, mod.meta));
}

/**
 * Merge database posts with local MDX posts, deduped by slug
 * (database wins), newest first.
 */
export function mergePosts(
  dbPosts: BlogPost[],
  localPosts: BlogPost[],
  options: { limit?: number } = {}
): BlogPost[] {
  const dbSlugs = new Set(dbPosts.map((p) => p.slug));
  const merged = [
    ...dbPosts,
    ...localPosts.filter((p) => !dbSlugs.has(p.slug)),
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return options.limit ? merged.slice(0, options.limit) : merged;
}

export function formatPostDate(dateIso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: locale === 'zh' ? 'long' : 'short',
    day: 'numeric',
  }).format(new Date(dateIso));
}
