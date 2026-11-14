import { contentUrl } from './content.ts';
interface Doc { id: string; data: { title: string; description?: string; date?: unknown; draft?: boolean } }
interface Section { label: string; slugs: string[] }

export function groupDocs(entries: Doc[], subcategory: string, sections?: Section[]) {
  const bySlug = new Map(entries.map(entry => [entry.id.slice(`docs/${subcategory}/`.length), { title: entry.data.title, url: contentUrl(entry.id), description: entry.data.description }]));
  const alphabetically = (a: { title: string }, b: typeof a) => a.title.localeCompare(b.title);
  if (!sections) return [{ label: '', docs: [...bySlug.values()].sort(alphabetically) }];
  const used = new Set<string>();
  const groups = sections.map(section => ({
    label: section.label,
    docs: section.slugs.flatMap(slug => {
      const doc = bySlug.get(slug);
      if (!doc) return [];
      used.add(slug);
      return [doc];
    }),
  })).filter(section => section.docs.length);
  const others = [...bySlug].filter(([slug]) => !used.has(slug)).map(([, doc]) => doc).sort(alphabetically);
  if (others.length) groups.push({ label: '기타', docs: others });
  return groups;
}

/** Sidebar shares the topic index order; book indexes retain their own child links. */
export function docsNavigationSections(entries: Doc[], subcategory: string, sections?: Section[]) {
  const published = entries.filter(entry => !entry.data.draft);
  return groupDocs(published.filter(entry => entry.id.startsWith(`docs/${subcategory}/`) && entry.id.split('/').length === 3), subcategory, sections).map(section => {
    const docs = section.docs.map(doc => ({
      ...doc,
      children: published.filter(entry => contentUrl(entry.id).startsWith(doc.url) && entry.id.split('/').length === 4)
        .sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }))
        .map(entry => ({ title: entry.data.title, url: contentUrl(entry.id) })),
    }));
    // A section named for one book needs one disclosure, rather than two identical labels.
    const book = docs.length === 1 && docs[0]?.title === section.label && docs[0].children.length ? docs[0] : undefined;
    return { ...section, overview: book?.url, docs: book ? book.children.map(doc => ({ ...doc, children: [] })) : docs };
  });
}

/** Category indexes describe topics; only dated leaf entries contribute to article counts. */
export function docsCatalog(entries: Doc[], groups: { label: string; items: { key: string; label: string }[] }[], sections: Record<string, Section[]>) {
  const published = entries.filter(entry => !entry.data.draft);
  const counts = new Map<string, number>();
  for (const entry of published) {
    if (entry.id.startsWith('docs/') && entry.id.split('/').length >= 3 && entry.data.date) {
      const key = entry.id.split('/')[1]!;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  const indexes = new Map(published.map(entry => [entry.id, entry]));
  return groups.map(group => ({
    label: group.label,
    items: group.items.filter(item => counts.has(item.key)).map(item => ({
      ...item,
      count: counts.get(item.key)!,
      url: indexes.has(`docs/${item.key}`) ? contentUrl(`docs/${item.key}`) : null,
      description: indexes.get(`docs/${item.key}`)?.data.description,
      sections: groupDocs(published.filter(entry => entry.id.startsWith(`docs/${item.key}/`) && entry.id.split('/').length === 3), item.key, sections[item.key]).map(section => section.label).filter(Boolean),
    })),
  })).filter(group => group.items.length);
}
