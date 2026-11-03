/** Shared by the list page and sitemap so empty blogs cannot be indexed. */
export function blogIsIndexable(posts: readonly unknown[]): boolean {
  return posts.length > 0;
}
