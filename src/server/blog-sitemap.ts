import { blogIsIndexable } from '@/lib/blog-indexing';
import { locales } from '@/paraglide/runtime.js';
import { getLocalPosts, mergePosts, type BlogPost } from '@/content/posts';

type BlogEntry = {
  path: string;
  lastModified?: string;
  changeFrequency: string;
  priority: number;
  languages: (typeof locales)[number][];
};

export async function publishedBlogEntries() {
  let dbPosts: BlogPost[] = [];
  try {
    const { listPublishedArticles } = await import('@/modules/posts/service');
    dbPosts = (await listPublishedArticles()).map((row) => ({
      slug: row.slug,
      title: row.title || row.slug,
      description: row.description || '',
      createdAt: new Date(row.createdAt).toISOString(),
      source: 'db',
    }));
  } catch {
    // The blog uses the same local-content fallback if its DB is unavailable.
  }

  const entries = new Map<string, BlogEntry>();
  for (const locale of locales) {
    const posts = mergePosts(dbPosts, getLocalPosts(locale));
    if (!blogIsIndexable(posts)) continue;
    const blog: BlogEntry = entries.get('/blog') ?? {
      path: '/blog',
      changeFrequency: 'weekly',
      priority: 0.6,
      languages: [],
    };
    blog.languages.push(locale);
    entries.set('/blog', blog);
    for (const post of posts) {
      const path = `/blog/${encodeURIComponent(post.slug)}`;
      const entry: BlogEntry = entries.get(path) ?? {
        path,
        lastModified: post.createdAt,
        changeFrequency: 'monthly',
        priority: 0.6,
        languages: [],
      };
      entry.languages.push(locale);
      entries.set(path, entry);
    }
  }
  return [...entries.values()];
}
