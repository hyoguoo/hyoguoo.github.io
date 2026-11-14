// @ts-check
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

/** @param {string | URL} root */
export function buildLastModMap(root) {
  const map = new Map();
  /** @param {string | URL} dir @param {string} urlBase */
  function walk(dir, urlBase) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir instanceof URL ? fileURLToPath(dir) : dir, entry.name);
      if (entry.isDirectory()) { walk(full, `${urlBase}/${entry.name}`); continue; }
      if (!/\.mdx?$/.test(entry.name)) continue;
      const match = readFileSync(full, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (!match) continue;
      const data = parse(match[1]);
      const value = data?.lastUpdated;
      if (typeof value !== 'string') continue;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) continue;
      const stem = entry.name.replace(/\.mdx?$/, '');
      const pathname = stem === 'index' ? `${urlBase}/` : `${urlBase}/${stem}/`;
      map.set(pathname, date.toISOString());
    }
  }
  walk(root, '');
  return map;
}
