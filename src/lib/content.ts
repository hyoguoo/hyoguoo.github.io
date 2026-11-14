/** Normalized collection data, shared by build-time lists and metadata. */
export function contentUrl(id: string): string {
  return `/${id.replace(/^\/+|\/+$/g, '')}/`;
}

export function isDocsArticle(id: string): boolean {
  return id.startsWith('docs/') && id.split('/').length >= 3;
}

/** Starlight also accepts boolean lastUpdated flags; these are not dates. */
export function contentDate(value: unknown): Date | undefined {
  if (!(value instanceof Date) && typeof value !== 'string') return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function updatedDate(data: { lastUpdated?: unknown; date?: unknown }): Date | undefined {
  return contentDate(data.lastUpdated) ?? contentDate(data.date);
}

export function formatDate(value: unknown): string {
  return contentDate(value)?.toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC',
  }) ?? '';
}

export function newestFirst(a: { data: { lastUpdated?: unknown; date?: unknown } }, b: typeof a): number {
  return (updatedDate(b.data)?.getTime() ?? 0) - (updatedDate(a.data)?.getTime() ?? 0);
}
