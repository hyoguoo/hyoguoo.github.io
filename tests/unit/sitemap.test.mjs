import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildLastModMap } from '../../src/build/sitemap.mjs';

test('sitemap reads YAML dates, indexes and comments using a root independent of cwd', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'blog-sitemap-'));
  try {
    await mkdir(path.join(root, 'docs'));
    await writeFile(path.join(root, 'index.mdx'), '---\nlastUpdated: "2026-01-02" # date\n---\n');
    await writeFile(path.join(root, 'docs', 'article.md'), '---\nlastUpdated: 2026-02-03\n---\n');
    await writeFile(path.join(root, 'docs', 'automatic.md'), '---\nlastUpdated: true\n---\n');
    await writeFile(path.join(root, 'docs', 'invalid.md'), '---\nlastUpdated: nope\n---\n');
    assert.deepEqual([...buildLastModMap(pathToFileURL(root))], [
      ['/docs/article/', '2026-02-03T00:00:00.000Z'], ['/', '2026-01-02T00:00:00.000Z'],
    ]);
  } finally { await rm(root, { recursive: true, force: true }); }
});
