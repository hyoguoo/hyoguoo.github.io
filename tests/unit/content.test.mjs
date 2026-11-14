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

test('blog grouping preserves primary tags, publication order and configured category order', async () => {
  const { groupBlogPosts } = await import('../../src/lib/blog.ts');
  const post = (id, tags, date) => ({ id, data: { title: id, tags, date: new Date(date) } });
  const result = groupBlogPosts([
    post('blog/a', ['Java', 'AI'], '2026-01-01'), post('blog/b', ['Java'], '2026-03-01'),
    post('blog/c', ['AI'], '2026-04-01'), post('blog/d', undefined, '2026-04-01'),
  ], ['AI', 'Java']);
  assert.deepEqual(result.map(([label]) => label), ['AI', 'Java', '기타']);
  assert.deepEqual(result[1][1].map(post => post.id), ['blog/b', 'blog/a']);
});

test('docs grouping keeps configured order and appends unassigned entries alphabetically', async () => {
  const { groupDocs } = await import('../../src/lib/docs.ts');
  const entries = ['z', 'a', 'b'].map(slug => ({ id: `docs/java/${slug}`, data: { title: slug } }));
  const result = groupDocs(entries, 'java', [{ label: 'Basic', slugs: ['b', 'absent'] }, { label: 'Empty', slugs: [] }]);
  assert.deepEqual(result.map(group => [group.label, group.docs.map(doc => doc.title)]), [['Basic', ['b']], ['기타', ['a', 'z']]]);
  assert.equal(result[0].docs[0].url, '/docs/java/b/');
});
