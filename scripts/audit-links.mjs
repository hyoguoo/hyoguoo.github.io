// Audit generated HTML, including redirect targets; never rewrite content to conceal failures.
import { chromium } from 'playwright';
import { readdir, readFile } from 'node:fs/promises';

const files = await readdir('dist', { recursive: true });
const known = new Set(files);
const browser = await chromium.launch();
const issues = [];
try {
  const page = await browser.newPage();
  const documents = [];
  for (const file of files.filter(file => file.endsWith('.html'))) {
    if (file === 'googledc85b49fa9ddc09f.html') continue; // Google ownership token, not a site page.
    const html = await readFile(`dist/${file}`, 'utf8');
    documents.push(await page.evaluate(({ file, html }) => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const base = new URL(file.replace(/index\.html$/, ''), 'https://hyoguoo.github.io/');
      const refresh = doc.querySelector('meta[http-equiv="refresh"]')?.getAttribute('content');
      return {
        file, ids: [...doc.querySelectorAll('[id]')].map(element => element.id),
        canonical: doc.querySelectorAll('link[rel=canonical]').length,
        redirect: refresh?.replace(/^.*?url=/i, ''),
        refs: [...doc.querySelectorAll('a[href],img[src],script[src],link[href]')].map(element => {
          const value = element.getAttribute(element.tagName === 'IMG' || element.tagName === 'SCRIPT' ? 'src' : 'href');
          const url = new URL(value, base);
          return url.origin === base.origin ? url.href : null;
        }).filter(Boolean),
      };
    }, { file, html }));
  }
  const byFile = new Map(documents.map(document => [document.file, document]));
  function targetFile(url) {
    let file = decodeURIComponent(url.pathname).slice(1);
    if (!file || file.endsWith('/')) file += 'index.html';
    if (!known.has(file) && known.has(`${file}/index.html`)) file += '/index.html';
    return file;
  }
  for (const document of documents) {
    if (document.canonical !== 1) issues.push(`${document.file}: expected one canonical, found ${document.canonical}`);
    for (const ref of document.refs) {
      let url = new URL(ref);
      let file = targetFile(url);
      let target = byFile.get(file);
      const seen = new Set();
      while (target?.redirect && !seen.has(file)) {
        seen.add(file);
        const next = new URL(target.redirect, url);
        if (!next.hash) next.hash = url.hash;
        url = next; file = targetFile(url); target = byFile.get(file);
      }
      if (seen.has(file)) issues.push(`${document.file}: redirect cycle → ${ref}`);
      else if (!known.has(file)) issues.push(`${document.file}: missing → ${ref}`);
      else if (url.hash && target && !target.ids.includes(decodeURIComponent(url.hash.slice(1)))) issues.push(`${document.file}: missing anchor → ${ref}`);
    }
  }
  console.log(`Audited ${documents.length} HTML pages: ${issues.length} issue(s).`);
  issues.forEach(issue => console.error(issue));
  if (issues.length) process.exitCode = 1;
} finally { await browser.close(); }
