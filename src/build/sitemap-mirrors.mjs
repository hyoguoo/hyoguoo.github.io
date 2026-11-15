// @ts-check
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Google Search Console keeps reporting "Couldn't fetch" for the github.io sitemaps
 * even though they are valid. These mirrors give it fresh URLs with the same content:
 * a plain-text sitemap and a single non-index XML sitemap.
 */
export const TEXT_SITEMAP = 'sitemap.txt';
export const SINGLE_SITEMAP = 'sitemap-pages.xml';

const CHUNK = /^sitemap-\d+\.xml$/;
const URLSET_OPEN = /^[\s\S]*?<urlset\b[^>]*>/;

/** @param {string[]} chunks sitemap chunk XML documents in order */
export function buildSitemapMirrors(chunks) {
  if (chunks.length === 0) throw new Error('No sitemap chunks to mirror');
  const head = chunks[0].match(URLSET_OPEN)?.[0];
  if (!head) throw new Error('Sitemap chunk has no <urlset> element');
  const urls = chunks.flatMap((xml) => xml.match(/<url>[\s\S]*?<\/url>/g) ?? []);
  const locs = urls.map((url) => {
    const loc = url.match(/<loc>([^<]+)<\/loc>/)?.[1];
    if (!loc) throw new Error('Sitemap <url> entry has no <loc>');
    return loc.replaceAll('&amp;', '&');
  });
  return { text: `${locs.join('\n')}\n`, xml: `${head}${urls.join('')}</urlset>` };
}

/** Runs after @astrojs/sitemap, so it must be listed after it in `integrations`. */
export function sitemapMirrors() {
  return {
    name: 'sitemap-mirrors',
    hooks: {
      /** @param {{ dir: URL, logger: { info(message: string): void } }} options */
      'astro:build:done': async ({ dir, logger }) => {
        const outDir = fileURLToPath(dir);
        const names = (await readdir(outDir)).filter((name) => CHUNK.test(name))
          .sort((a, b) => Number(a.match(/\d+/)?.[0]) - Number(b.match(/\d+/)?.[0]));
        const chunks = await Promise.all(names.map((name) => readFile(path.join(outDir, name), 'utf8')));
        const { text, xml } = buildSitemapMirrors(chunks);
        await writeFile(path.join(outDir, TEXT_SITEMAP), text);
        await writeFile(path.join(outDir, SINGLE_SITEMAP), xml);
        logger.info(`Mirrored ${text.trimEnd().split('\n').length} URLs to ${TEXT_SITEMAP} and ${SINGLE_SITEMAP}`);
      },
    },
  };
}
