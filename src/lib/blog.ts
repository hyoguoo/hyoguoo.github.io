import type { StarlightBlogPostData } from 'starlight-blog/data';

export const isBlogArchive = (pathname: string) => /^\/blog\/(?:\d+\/|tags\/[^/]+\/|authors\/[^/]+\/)?$/.test(pathname);

/** Use the plugin's published order and public tag URLs, keeping its page boundaries. */
export function blogArchive(posts: StarlightBlogPostData[], pathname: string, pageSize: number, categoryOrder: string[], authorName?: string) {
  const categories = new Map<string, { label: string; href: string; count: number }>();
  for (const post of posts) {
    const tag = post.tags[0];
    if (!tag) continue;
    const category = categories.get(tag.label) ?? { ...tag, count: 0 };
    category.count++;
    categories.set(tag.label, category);
  }
  const tags = [...categories.values()].sort((a,b) => {
    const ai = categoryOrder.indexOf(a.label), bi = categoryOrder.indexOf(b.label);
    return (ai < 0 ? Infinity : ai) - (bi < 0 ? Infinity : bi) || a.label.localeCompare(b.label);
  });
  const tag = posts.flatMap(post => post.tags).find(tag => tag.href === pathname);
  const filtered = tag ? posts.filter(post => post.tags.some(t => t.href === pathname))
    : authorName ? posts.filter(post => post.authors.some(author => author.name === authorName)) : posts;
  const paginated = /^\/blog\/(?:\d+\/)?$/.test(pathname);
  const page = Number(pathname.match(/^\/blog\/(\d+)\/$/)?.[1] ?? 1);
  return {
    categories: tags,
    selectedTag: tag?.label,
    page,
    pageCount: paginated ? Math.ceil(filtered.length / pageSize) : 1,
    total: filtered.length,
    posts: paginated ? filtered.slice((page-1)*pageSize,page*pageSize) : filtered,
  };
}
