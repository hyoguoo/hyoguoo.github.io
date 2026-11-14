import test from 'node:test';
import assert from 'node:assert/strict';
import { contentDate, newestFirst, updatedDate, formatDate, contentUrl, isDocsArticle } from '../../src/lib/content.ts';
import { jsonLd, titleHtml } from '../../src/lib/metadata.ts';
import { parsePortfolioHash } from '../../src/lib/portfolio-state.ts';

test('dates reject Starlight boolean flags and malformed dates, falling back to publication', () => {
  for (const value of [true, false, undefined, null, 'bad-date', new Date(NaN)]) assert.equal(contentDate(value), undefined);
  assert.equal(updatedDate({ lastUpdated: true, date: new Date('2026-01-02') }).toISOString(), '2026-01-02T00:00:00.000Z');
  assert.equal(formatDate(new Date('2026-01-02T00:00:00Z')), 'Jan 2, 2026');
  const entries = [{ data: { date: '2026-01-02' } }, { data: { date: '2025-01-01', lastUpdated: '2026-02-03' } }];
  assert.equal(entries.sort(newestFirst)[0].data.lastUpdated, '2026-02-03');
});

test('content paths retain trailing slashes and exclude category indexes from articles', () => {
  assert.equal(contentUrl('blog/example'), '/blog/example/');
  assert.equal(contentUrl('/docs/java/class/'), '/docs/java/class/');
  assert.equal(isDocsArticle('docs/java'), false);
  assert.equal(isDocsArticle('docs/java/class'), true);
});

test('titles and JSON-LD cannot inject HTML or close their script', () => {
  assert.equal(titleHtml('<img src=x> `A<B>` &'), '&lt;img src=x&gt; <code>A&lt;B&gt;</code> &amp;');
  const value = { title: '</script><script>alert(1)</script>' };
  assert.ok(!jsonLd(value).includes('<'));
  assert.deepEqual(JSON.parse(jsonLd(value)), value);
});

test('portfolio hashes validate indexes and tolerate malformed/hostile escapes', () => {
  assert.deepEqual(parsePortfolioHash('#s=02&sm=pg', 5), { s: '2', sm: 'pg' });
  for (const hash of ['#s=%', '#s=%E0%A4%A', '#s=-1', '#s=5', '#s=1.5', '#s=%22%5D%20*', '#sm=unknown']) assert.deepEqual(parsePortfolioHash(hash, 5), {});
});

test('docs grouping keeps configured order and appends unassigned entries alphabetically', async () => {
  const { groupDocs } = await import('../../src/lib/docs.ts');
  const entries = ['z', 'a', 'b'].map(slug => ({ id: `docs/java/${slug}`, data: { title: slug } }));
  const result = groupDocs(entries, 'java', [{ label: 'Basic', slugs: ['b', 'absent'] }, { label: 'Empty', slugs: [] }]);
  assert.deepEqual(result.map(group => [group.label, group.docs.map(doc => doc.title)]), [['Basic', ['b']], ['기타', ['a', 'z']]]);
  assert.equal(result[0].docs[0].url, '/docs/java/b/');
});

test('docs catalog counts dated articles, preserves hierarchy, and carries descriptions', async () => {
  const { docsCatalog, groupDocs } = await import('../../src/lib/docs.ts');
  const entries = [
    { id: 'docs/java', data: { title: 'Java', description: 'Java topic' } },
    { id: 'docs/java/jvm', data: { title: 'JVM', description: 'Runtime', date: new Date() } },
    { id: 'docs/java/book', data: { title: 'Book', description: 'Chapters' } },
    { id: 'docs/java/book/item1', data: { title: 'Item 1', date: new Date() } },
    { id: 'docs/java/draft', data: { title: 'Draft', date: new Date(), draft: true } },
  ];
  const sections = { java: [{ label: 'Runtime', slugs: ['jvm'] }, { label: 'Books', slugs: ['book'] }] };
  const catalog = docsCatalog(entries, [{ label: 'Language', items: [{ key: 'java', label: 'Java' }, { key: 'empty', label: 'Empty' }] }], sections);
  assert.deepEqual(catalog[0].items[0], { key: 'java', label: 'Java', count: 2, url: '/docs/java/', description: 'Java topic', sections: ['Runtime', 'Books'] });
  assert.equal(catalog[0].items.length, 1);
  assert.equal(groupDocs(entries.slice(1,2), 'java', sections.java)[0].docs[0].description, 'Runtime');
});

test('blog archives retain plugin tag URLs, publication order and five-post page boundaries', async () => {
  const { blogArchive, isBlogArchive } = await import('../../src/lib/blog.ts');
  const posts = Array.from({ length: 11 }, (_,i) => ({ title: `Post ${i}`, href: `/blog/p${i}/`, tags: [{ label: i%2 ? 'Java' : 'Spring & JPA', href: i%2 ? '/blog/tags/java/' : '/blog/tags/spring--jpa/' }], authors: [{ name: 'hyoguoo' }] }));
  assert.deepEqual(blogArchive(posts, '/blog/2/', 5, ['Java']).posts.map(p=>p.title), ['Post 5','Post 6','Post 7','Post 8','Post 9']);
  assert.equal(blogArchive(posts, '/blog/', 5, []).pageCount, 3);
  const tag = blogArchive(posts, '/blog/tags/spring--jpa/', 5, []);
  assert.equal(tag.total, 6); assert.equal(tag.posts.length, 6); assert.equal(tag.pageCount, 1);
  assert.equal(tag.selectedTag, 'Spring & JPA');
  assert.equal(blogArchive(posts, '/blog/authors/hyoguoo/', 5, [], 'hyoguoo').total, 11);
  for (const path of ['/blog/', '/blog/2/', '/blog/tags/java/', '/blog/authors/hyoguoo/']) assert.ok(isBlogArchive(path));
  assert.equal(isBlogArchive('/blog/p1/'), false);
});

test('document navigation follows sections and keeps nested book items in numeric order', async () => {
  const { docsNavigationSections } = await import('../../src/lib/docs.ts');
  const entries = [
    { id: 'docs/java/book', data: { title: 'Book' } },
    { id: 'docs/java/book/item10', data: { title: 'Earlier alphabetically' } },
    { id: 'docs/java/book/item2', data: { title: 'Later alphabetically' } },
    { id: 'docs/java/book/draft', data: { title: 'Draft', draft: true } },
    { id: 'docs/java/jvm', data: { title: 'JVM' } },
    { id: 'docs/java/other', data: { title: 'Other' } },
  ];
  const result = docsNavigationSections(entries, 'java', [{ label: 'Runtime', slugs: ['jvm'] }, { label: 'Books', slugs: ['book'] }]);
  assert.deepEqual(result.map(section => section.label), ['Runtime', 'Books', '기타']);
  assert.deepEqual(result.flatMap(section => section.docs).map(doc => doc.title), ['JVM', 'Book', 'Other']);
  assert.deepEqual(result[1].docs[0].children.map(doc => doc.url), ['/docs/java/book/item2/', '/docs/java/book/item10/']);
  const book = docsNavigationSections(entries, 'java', [{ label: 'Book', slugs: ['book'] }])[0];
  assert.equal(book.overview, '/docs/java/book/');
  assert.deepEqual(book.docs.map(doc => doc.url), ['/docs/java/book/item2/', '/docs/java/book/item10/']);
});
