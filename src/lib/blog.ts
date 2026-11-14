import { contentDate, contentUrl } from './content.ts';

interface Post {
  id: string;
  data: { title: string; tags?: string[]; date?: Date };
}
export function groupBlogPosts(entries: Post[], categoryOrder: string[]) {
  const categories = new Map<string, { id: string; title: string; url: string; date: Date }[]>();
  for (const entry of entries) {
    const category = entry.data.tags?.[0] ?? '기타';
    const posts = categories.get(category) ?? [];
    posts.push({ id: entry.id, title: entry.data.title, url: contentUrl(entry.id), date: contentDate(entry.data.date) ?? new Date(0) });
    categories.set(category, posts);
  }
  for (const posts of categories.values()) posts.sort((a, b) => b.date.getTime() - a.date.getTime());
  return [...categories].sort(([a], [b]) => {
    const ai = categoryOrder.indexOf(a), bi = categoryOrder.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b);
  });
}
