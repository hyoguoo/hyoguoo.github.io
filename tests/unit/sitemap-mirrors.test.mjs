import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSitemapMirrors } from '../../src/build/sitemap-mirrors.mjs';

const HEAD = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

test('sitemap mirrors keep every chunk URL in order as text and a single urlset', () => {
  const chunks = [
    `${HEAD}<url><loc>https://example.com/</loc></url><url><loc>https://example.com/a/?x=1&amp;y=2</loc><lastmod>2026-01-02T00:00:00.000Z</lastmod></url></urlset>`,
    `${HEAD}<url><loc>https://example.com/b/</loc></url></urlset>`,
  ];
  const { text, xml } = buildSitemapMirrors(chunks);
  assert.equal(text, 'https://example.com/\nhttps://example.com/a/?x=1&y=2\nhttps://example.com/b/\n');
  assert.equal(xml, `${HEAD}<url><loc>https://example.com/</loc></url><url><loc>https://example.com/a/?x=1&amp;y=2</loc><lastmod>2026-01-02T00:00:00.000Z</lastmod></url><url><loc>https://example.com/b/</loc></url></urlset>`);
});

test('sitemap mirrors fail loudly instead of publishing an empty sitemap', () => {
  assert.throws(() => buildSitemapMirrors([]), /No sitemap chunks/);
  assert.throws(() => buildSitemapMirrors(['<html></html>']), /no <urlset>/);
});
