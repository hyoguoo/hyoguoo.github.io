import { contentUrl } from './content.ts';
interface Doc { id: string; data: { title: string } }
interface Section { label: string; slugs: string[] }

export function groupDocs(entries: Doc[], subcategory: string, sections?: Section[]) {
  const bySlug = new Map(entries.map(entry => [entry.id.slice(`docs/${subcategory}/`.length), { title: entry.data.title, url: contentUrl(entry.id) }]));
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
