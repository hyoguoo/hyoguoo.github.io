import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { startBrowser, isolatedPage } from '../helpers/browser.mjs';
let site;
before(async () => { site = await startBrowser(); });
after(async () => { await site?.close(); });

test('major routes, tags, author archive, pagination and trailing slashes render', async () => {
  const { context, page, errors, failures } = await isolatedPage(site.browser);
  try {
    for (const route of ['/', '/about/', '/blog/', '/blog/2/', '/blog/tags/java/', '/blog/authors/hyoguoo/', '/docs/', '/docs/java/', '/docs/java/class/', '/blog/payment-system-test/', '/payment-platform-portfolio/', '/404.html']) {
      await page.goto(site.base + route);
      await page.waitForLoadState('networkidle');
      assert.ok(await page.locator('h1').count(), route);
      assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'), 'https://hyoguoo.github.io' + route);
      assert.equal(await page.locator('meta[property="og:image"]').count(), 1, route);
    }
    assert.deepEqual(errors, []); assert.deepEqual(failures, []);
  } finally { await context.close(); }
});

test('theme works with blocked storage and follows system changes only in auto mode', async () => {
  const { context, page, errors } = await isolatedPage(site.browser, { colorScheme: 'dark' });
  await context.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked', 'SecurityError'); } }); });
  try {
    for (const route of ['/', '/about/', '/docs/java/class/']) {
      await page.goto(site.base + route);
      const picker = page.locator('#theme-select, starlight-theme-select select').first();
      await picker.selectOption('light');
      await page.waitForFunction(() => document.documentElement.dataset.theme === 'light');
      await page.emulateMedia({ colorScheme: 'dark' });
      assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
      await picker.selectOption('auto');
      await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
      await page.emulateMedia({ colorScheme: 'light' });
      await page.waitForFunction(() => document.documentElement.dataset.theme === 'light');
    }
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('About hides unavailable stats even when image errors precede module initialization', async () => {
  const { context, page, errors } = await isolatedPage(site.browser);
  try {
    await page.goto(site.base + '/about/');
    await page.waitForFunction(() => document.getElementById('stats-section').style.display === 'none');
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('mobile menu closes with Escape/outside click and reconnects without duplicate listeners', async () => {
  const { context, page, errors } = await isolatedPage(site.browser, { viewport: { width: 390, height: 844 } });
  try {
    await page.goto(site.base + '/blog/');
    const button = page.locator('blog-mobile-menu button');
    await button.click(); assert.equal(await button.getAttribute('aria-expanded'), 'true');
    await page.keyboard.press('Escape'); assert.equal(await button.getAttribute('aria-expanded'), 'false');
    assert.equal(await button.evaluate(el => el === document.activeElement), true);
    await page.evaluate(() => { const menu = document.querySelector('blog-mobile-menu'); menu.remove(); document.body.append(menu); });
    await button.click(); assert.equal(await button.getAttribute('aria-expanded'), 'true');
    await page.locator('h1').click(); assert.equal(await button.getAttribute('aria-expanded'), 'false');
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('Mermaid renders and redraws after rapid theme changes; Giscus receives theme messages', async () => {
  const { context, page, errors, failures } = await isolatedPage(site.browser);
  try {
    await page.addInitScript(() => { window.addEventListener('message', event => { if (event.data.testTheme) document.documentElement.dataset.testGiscusTheme = event.data.testTheme; }); });
    await page.goto(site.base + '/blog/payment-gateway-strategy-pattern/');
    await page.waitForFunction(() => document.querySelectorAll('.mermaid-diagram svg').length === 2);
    const picker = page.locator('starlight-theme-select select').first();
    await picker.selectOption('light'); await picker.selectOption('dark'); await picker.selectOption('light');
    await page.waitForFunction(() => document.documentElement.dataset.testGiscusTheme === 'light');
    await page.waitForFunction(() => [...document.querySelectorAll('.mermaid-diagram')].every(el => el.dataset.renderedTheme === 'default'));
    assert.equal(await page.locator('script[src="https://giscus.app/client.js"]').getAttribute('data-mapping'), 'pathname');
    assert.deepEqual(errors, []); assert.deepEqual(failures, []);
  } finally { await context.close(); }
});

test('portfolio malformed hashes, state tabs, scenarios, detail rendering and print restoration work', async () => {
  const { context, page, errors, failures } = await isolatedPage(site.browser);
  try {
    await page.goto(site.base + '/payment-platform-portfolio/#s=%');
    await page.locator('#themeBtn').click();
    await page.locator('#scnPicker .scn-btn').nth(2).click();
    assert.ok(page.url().includes('s=2'));
    await page.locator('#smTabPg').click();
    assert.equal(await page.locator('#sm-pg').evaluate(el => el.hidden), false);
    await page.locator('#pgSmWrap [data-state="IN_PROGRESS"]').click();
    assert.ok((await page.locator('#pgCfDetail').textContent()).includes('IN_PROGRESS'));
    await page.locator('#archWrap [data-id="payment"]').click();
    assert.ok((await page.locator('#archDetail').textContent()).includes('payment-service'));
    await page.locator('#pgFlowToggle').click();
    assert.equal(await page.locator('#pgFlowToggle').getAttribute('aria-pressed'), 'true');
    const invalidSvg = await page.locator('svg *').evaluateAll(elements => elements.flatMap(element => [...element.attributes].filter(attribute => /NaN|undefined/.test(attribute.value)).map(attribute => attribute.value)));
    assert.deepEqual(invalidSvg, []);
    const before = await page.locator('details[open]').count();
    await page.evaluate(() => { dispatchEvent(new Event('beforeprint')); dispatchEvent(new Event('afterprint')); });
    assert.equal(await page.locator('details[open]').count(), before);
    assert.deepEqual(errors, []); assert.deepEqual(failures, []);
  } finally { await context.close(); }
});

test('search index returns documents and sidebar expands the active document', async () => {
  const { context, page, errors, failures } = await isolatedPage(site.browser);
  try {
    await page.goto(site.base + '/docs/java/class/');
    assert.equal(await page.locator('nav.sidebar a[aria-current=page]').count(), 1);
    assert.ok(await page.locator('nav.sidebar details[open]').count());
    const results = await page.evaluate(async () => {
      const pagefind = await import('/pagefind/pagefind.js');
      return (await pagefind.search('Java')).results.length;
    });
    assert.ok(results > 0);
    await page.locator('site-search button[data-open-modal]').click();
    await page.locator('site-search input').fill('Java');
    await page.waitForSelector('.pagefind-ui__result-link');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('site-search dialog').evaluate(dialog => dialog.open), false);
    assert.deepEqual(errors, []); assert.deepEqual(failures, []);
  } finally { await context.close(); }
});

test('existing routes, RSS items, sitemap URLs and article metadata survive the framework upgrade', async () => {
  const { readFile, readdir } = await import('node:fs/promises');
  const files = new Set(await readdir('dist', { recursive: true }));
  const existing = JSON.parse(await readFile('tests/fixtures/routes.json', 'utf8'));
  assert.deepEqual(existing.filter(file => !files.has(file)), []);
  const { context, page } = await isolatedPage(site.browser);
  try {
    const rss = await readFile('dist/blog/rss.xml', 'utf8');
    const items = await page.evaluate(xml => [...new DOMParser().parseFromString(xml, 'application/xml').querySelectorAll('item')].map(item => Object.fromEntries(['title', 'link', 'pubDate'].map(key => [key, item.querySelector(key).textContent]))), rss);
    assert.deepEqual(items, JSON.parse(await readFile('tests/fixtures/rss.json', 'utf8')));
    const sitemap = await readFile('dist/sitemap-0.xml', 'utf8');
    const sitemapUrls = await page.evaluate(xml => [...new DOMParser().parseFromString(xml, 'application/xml').querySelectorAll('url > loc')].map(element => element.textContent), sitemap);
    for (const href of sitemapUrls) {
      assert.ok(href.startsWith('https://hyoguoo.github.io/'));
      assert.ok(href.endsWith('/'), href);
      const path = decodeURIComponent(new URL(href).pathname).slice(1) + 'index.html';
      assert.ok(files.has(path), href);
    }
    for (const route of ['/docs/java/class/', '/blog/payment-system-test/']) {
      await page.goto(site.base + route);
      const data = await page.locator('script[type="application/ld+json"]').evaluateAll(elements => elements.map(element => JSON.parse(element.textContent)));
      assert.equal(data.filter(schema => schema['@type'] === 'BlogPosting' || schema['@type'] === 'TechArticle').length, 1);
      assert.equal(await page.locator('meta[property="article:published_time"]').count(), 1);
    }
  } finally { await context.close(); }
});

test('all generated Mermaid blocks parse with the installed library', async () => {
  const { readFile, readdir } = await import('node:fs/promises');
  const { context, page } = await isolatedPage(site.browser);
  try {
    const mermaidRoot = new URL('../../node_modules/mermaid/dist/', import.meta.url);
    await context.route('https://mermaid.test/**', async route => {
      const path = new URL(route.request().url()).pathname.slice(1);
      const body = await readFile(new URL(path, mermaidRoot));
      await route.fulfill({ contentType: 'application/javascript', headers: { 'Access-Control-Allow-Origin': '*' }, body });
    });
    const sources = [];
    for (const file of (await readdir('dist', { recursive: true })).filter(file => file.endsWith('.html'))) {
      const html = await readFile(`dist/${file}`, 'utf8');
      sources.push(...await page.evaluate(({ html, file }) => [...new DOMParser().parseFromString(html, 'text/html').querySelectorAll('pre[data-language="mermaid"] code')].map(code => ({ file, source: [...code.querySelectorAll('.ec-line')].map(line => line.textContent).join('\n') })), { file, html }));
    }
    const errors = await page.evaluate(async sources => {
      const { default: mermaid } = await import('https://mermaid.test/mermaid.esm.min.mjs');
      mermaid.initialize({ startOnLoad: false });
      const errors = [];
      for (const { file, source } of sources) {
        try { await mermaid.parse(source); } catch (error) { errors.push(`${file}: ${error}`); }
      }
      return errors;
    }, sources);
    assert.ok(sources.length > 0);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('animated scenario playback advances and stops when the page enters bfcache', async () => {
  const { context, page, errors, failures } = await isolatedPage(site.browser, { reducedMotion: 'no-preference' });
  try {
    await page.goto(site.base + '/payment-platform-portfolio/');
    await page.locator('#scnPlay').click();
    await page.waitForFunction(() => Number(document.querySelector('.scn-hop.cur')?.getAttribute('data-k')) >= 1);
    await page.evaluate(() => dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
    assert.ok((await page.locator('#scnPlay').textContent()).includes('재생'));
    const stoppedAt = await page.locator('.scn-hop.cur').getAttribute('data-k');
    await page.waitForTimeout(1000);
    assert.equal(await page.locator('.scn-hop.cur').getAttribute('data-k'), stoppedAt);
    assert.deepEqual(errors, []); assert.deepEqual(failures, []);
  } finally { await context.close(); }
});
