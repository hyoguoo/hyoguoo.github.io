import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { parse } from 'yaml';
import { DOCS_GROUPS } from '../../src/data/docsGroups.ts';
import { BLOG_SERIES } from '../../src/data/blogSeries.ts';
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
    const button = page.locator('site-mobile-menu button');
    await button.click(); assert.equal(await button.getAttribute('aria-expanded'), 'true');
    await page.keyboard.press('Escape'); assert.equal(await button.getAttribute('aria-expanded'), 'false');
    assert.equal(await button.evaluate(el => el === document.activeElement), true);
    await page.evaluate(() => { const menu = document.querySelector('site-mobile-menu'); menu.remove(); document.body.append(menu); });
    await button.click(); assert.equal(await button.getAttribute('aria-expanded'), 'true');
    const url = page.url();
    await page.locator('.archive-count').click(); assert.equal(await button.getAttribute('aria-expanded'), 'false');
    assert.equal(page.url(), url);
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
    const blogRoot = 'src/content/docs/blog';
    const posts = [];
    for (const file of await readdir(blogRoot, { recursive: true })) {
      if (!/\.mdx?$/.test(file)) continue;
      const source = await readFile(`${blogRoot}/${file}`, 'utf8');
      const data = parse(source.match(/^---\r?\n([\s\S]*?)\r?\n---/)[1]);
      if (!data.date || data.draft) continue;
      const slug = data.slug ?? `blog/${file.replace(/\.mdx?$/, '').replace(/\/index$/, '')}`;
      posts.push({ title: data.title, link: `https://hyoguoo.github.io/${slug}/`, pubDate: new Date(data.date).toUTCString() });
    }
    posts.sort((a, b) => Date.parse(b.pubDate) - Date.parse(a.pubDate) || a.title.localeCompare(b.title));
    // The plugin includes at least the latest 20 posts, plus any remaining posts in the current archive period.
    assert.ok(items.length >= Math.min(20, posts.length));
    assert.deepEqual(items, posts.slice(0, items.length));
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

test('home stays concise and About groups existing record links without a dated study preview', async () => {
  const { context, page, errors } = await isolatedPage(site.browser);
  try {
    await page.goto(site.base + '/');
    assert.equal(await page.locator('.home-columns > section').nth(0).locator('.content-preview').count(), 3);
    assert.equal(await page.locator('.home-columns > section').nth(1).locator('.content-preview').count(), 4);
    assert.equal(await page.locator('.profile-role').textContent(), 'Software Engineer');
    assert.ok(!(await page.locator('body').textContent()).includes('Java & Spring'));
    await page.locator('.site-navigation a[href="/about/"]:visible').click();
    assert.equal(new URL(page.url()).pathname, '/about/');
    assert.equal(await page.locator('.site-navigation a[href="/about/"]:visible').getAttribute('target'), null);
    assert.deepEqual(await page.locator('.record-links a').evaluateAll(links => links.map(a=>a.getAttribute('href'))), ['/about/study-log/', '/about/1-day-1-commit/']);
    assert.equal(await page.locator('.records time, .study-record').count(), 0);
    assert.equal(await page.locator('.skills li').count(), 8);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('Docs keeps the configured hierarchy and displays descriptions before hover', async () => {
  const { context, page, errors } = await isolatedPage(site.browser);
  try {
    await page.goto(site.base + '/docs/');
    const groups = page.locator('.docs-tree > section');
    assert.equal(await groups.count(), DOCS_GROUPS.length);
    for (const [index, group] of DOCS_GROUPS.entries()) {
      assert.deepEqual(await groups.nth(index).locator('.link-row').evaluateAll(links => links.map(link => link.getAttribute('href'))), group.items.map(item => `/docs/${item.key}/`));
    }
    await page.goto(site.base + '/docs/computer-architecture/');
    assert.deepEqual(await page.locator('.subcategory-page .list-label').evaluateAll(headings => headings.map(h=>h.firstChild.textContent)), ['Fundamentals','CPU & Execution']);
    assert.equal(await page.locator('.subcategory-page .link-description:visible').count(), 6);
    assert.ok((await page.locator('.subcategory-page .link-description').first().textContent()).includes('CPU'));
    assert.equal(await page.locator('.subcategory-page .link-row').first().getAttribute('href'), '/docs/computer-architecture/basic/');
    assert.equal(await page.locator('.docs-tags, #giscus-container').count(), 0);
    await page.goto(site.base + '/docs/java/');
    assert.equal(await page.locator('.subcategory-page .doc-section').count(), 8);
    assert.equal(await page.locator('.subcategory-page .link-row').first().getAttribute('href'), '/docs/java/jvm/');
    assert.ok(await page.locator('.subcategory-page a[href="/docs/java/effective-java/"]').count());
    await page.goto(site.base + '/docs/java/effective-java/');
    assert.ok(await page.locator('.right-sidebar a[href*="chapter"]').count());
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('mobile header exposes theme selection and retains it across section navigation', async () => {
  const { context, page, errors } = await isolatedPage(site.browser, { viewport: { width: 390, height: 844 } });
  try {
    for (const route of ['/', '/about/', '/blog/', '/docs/computer-architecture/']) {
      await page.goto(site.base + route);
      const picker = page.locator('[data-theme-picker]:visible').first();
      const bounds = await picker.boundingBox();
      assert.ok(bounds && bounds.x>=0 && bounds.x+bounds.width<=390, route);
      await picker.selectOption('light');
      assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth), false);
    }
    await page.goto(site.base + '/');
    assert.equal(await page.locator('#theme-select').inputValue(), 'light');
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('list feedback preserves layout, supports keyboard focus and respects reduced motion', async () => {
  const { context, page, errors } = await isolatedPage(site.browser, { reducedMotion: 'no-preference' });
  try {
    await page.goto(site.base + '/docs/computer-architecture/');
    const link = page.locator('.subcategory-page .site-link').first();
    const before = await link.boundingBox();
    await link.hover(); await page.waitForTimeout(220);
    assert.deepEqual(await link.boundingBox(), before);
    assert.equal(await link.locator('.site-link-arrow').evaluate(el=>getComputedStyle(el).transform), 'matrix(1, 0, 0, 1, 4, 0)');
    assert.equal(await link.evaluate(el=>getComputedStyle(el,'::before').content), 'none');
    await page.mouse.move(0,0); await page.keyboard.press('Tab'); await link.focus();
    assert.equal(await link.evaluate(el=>el.matches(':focus-visible')), true);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await link.evaluate(el=>getComputedStyle(el).transitionDuration), '0s');
    assert.equal(await link.locator('.site-link-arrow').evaluate(el=>getComputedStyle(el).transform), 'none');
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('Docs articles keep the directory hierarchy, compact metadata and readable typography', async () => {
  const { context, page, errors, failures } = await isolatedPage(site.browser);
  try {
    for (const route of ['/docs/computer-architecture/basic/', '/docs/redis/cache/', '/docs/java/class/', '/docs/java/effective-java/item1/']) {
      await page.goto(site.base + route);
      await page.waitForLoadState('networkidle');
      const current = page.locator('.docs-directory a[aria-current="page"]');
      assert.equal(await current.count(), 1, route);
      assert.equal(await current.getAttribute('href'), route);
      assert.equal(await current.evaluate(el => {
        for (let parent=el.parentElement; parent; parent=parent.parentElement) if (parent instanceof HTMLDetailsElement && !parent.open) return false;
        return true;
      }), true, route);
      await page.waitForFunction(() => {
        const link = document.querySelector('.docs-directory a[aria-current="page"]')?.getBoundingClientRect();
        const pane = document.querySelector('#starlight__sidebar')?.getBoundingClientRect();
        return link && pane && link.top >= pane.top && link.bottom <= pane.bottom;
      });
      assert.equal(await page.evaluate(() => scrollY), 0, 'revealing the sidebar must not scroll the article');
      assert.equal(await page.locator('.metadata.compact time').count(), 2);
      assert.equal(await page.locator('.metadata .title').count(), 0);
      assert.equal(await page.locator('.content-panel:first-of-type .index-description').count(), 0);
      const description = await page.locator('meta[name="description"]').getAttribute('content');
      assert.ok(description?.length, route);
      assert.equal(await page.locator('meta[property="og:description"]').getAttribute('content'), description);
      assert.ok(await page.locator('.article-path a[href="/docs/"]').count());
      assert.equal(await page.locator('html').getAttribute('data-article'), 'docs');
      assert.ok(await page.locator('h1').evaluate(el => parseFloat(getComputedStyle(el).fontSize) <= 34));
      assert.ok(await page.locator('.sl-markdown-content').evaluate(el => el.getBoundingClientRect().width <= 800));
    }
    await page.goto(site.base + '/docs/computer-architecture/basic/');
    await page.waitForLoadState('networkidle');
    assert.deepEqual(await page.locator('.topic[open] .doc-group > summary').allTextContents(), ['Fundamentals', 'CPU & Execution']);
    const section = page.locator('.topic[open] .doc-group').last();
    assert.equal(await section.getAttribute('open'), null);
    await section.locator('summary').focus(); await page.keyboard.press('Enter');
    assert.notEqual(await section.getAttribute('open'), null);
    await section.locator('a[href="/docs/computer-architecture/cpu-work/"]').click();
    assert.equal(new URL(page.url()).pathname, '/docs/computer-architecture/cpu-work/');
    const heading = page.locator('.sl-markdown-content h2').first();
    assert.ok(await heading.evaluate(el => parseFloat(getComputedStyle(el).fontSize) <= 24));
    assert.deepEqual(errors, []); assert.deepEqual(failures, []);
  } finally { await context.close(); }
});

test('mobile Docs reveals nested active links and keeps code and tables within the viewport', async () => {
  const { context, page, errors, failures } = await isolatedPage(site.browser, { viewport: { width: 390, height: 844 } });
  try {
    for (const width of [390, 320]) {
      await page.setViewportSize({width, height: 844});
      for (const route of ['/docs/java/effective-java/item1/', '/docs/java/effective-java/']) {
        await page.goto(site.base + route);
      await page.waitForLoadState('networkidle');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${width}: ${route}`);
        if (route.endsWith('item1/')) {
          assert.ok(await page.locator('.expressive-code pre').count());
          assert.equal(await page.locator('.expressive-code pre').first().evaluate(el => getComputedStyle(el).overflowX), 'auto');
        } else assert.ok(await page.locator('.sl-markdown-content table').count());
        await page.locator('button[popovertarget="starlight__sidebar"]').click();
        await page.waitForFunction(() => {
          const pane = document.getElementById('starlight__sidebar');
          const current = pane.querySelector('a[aria-current="page"]').getBoundingClientRect();
          const bounds = pane.getBoundingClientRect();
          return pane.matches(':popover-open') && current.top >= bounds.top && current.bottom <= bounds.bottom;
        });
        assert.equal(await page.locator('.docs-directory .caret').first().evaluate(el => getComputedStyle(el).transitionDuration), '0s');
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => !document.querySelector('.main-frame').inert);
        assert.equal(await page.evaluate(() => scrollY), 0);
      }
    }
    assert.deepEqual(errors, []); assert.deepEqual(failures, []);
  } finally { await context.close(); }
});

test('Blog article header shares compact metadata while retaining series links and anchors', async () => {
  const { context, page, errors, failures } = await isolatedPage(site.browser);
  try {
    await page.goto(site.base + '/blog/payment-system-test/');
    assert.equal(await page.locator('html').getAttribute('data-article'), 'blog');
    assert.equal(await page.locator('.metadata.compact').count(), 1);
    assert.equal(await page.locator('.metadata .title').count(), 0);
    assert.ok(await page.locator('.series-list a[href^="/blog/"]').count());
    assert.equal(await page.locator('.series-block').getAttribute('open'), null);
    assert.ok(await page.locator('.sl-markdown-content').evaluate(el => el.getBoundingClientRect().top < innerHeight));
    await page.locator('.series-block summary').focus(); await page.keyboard.press('Enter');
    assert.notEqual(await page.locator('.series-block').getAttribute('open'), null);
    assert.deepEqual(await page.locator('.series-list li').evaluateAll(items => items.map(item => item.querySelector('a')?.getAttribute('href') ?? location.pathname)), BLOG_SERIES.payment.posts.map(post => `/${post.id}/`));
    assert.equal(await page.locator('.series-list [aria-current="page"]').count(), 1);
    await page.locator('.series-block summary').click();
    const anchor = page.locator('.right-sidebar a[href^="#"]:visible').nth(1);
    const target = await anchor.getAttribute('href');
    await anchor.click();
    const heading = page.locator(`[id="${decodeURIComponent(target.slice(1))}"]`);
    await heading.waitFor({state:'visible'});
    await page.waitForFunction(id => document.getElementById(id).getBoundingClientRect().top >= document.querySelector('header').getBoundingClientRect().bottom, decodeURIComponent(target.slice(1)));
    assert.deepEqual(errors, []); assert.deepEqual(failures, []);
  } finally { await context.close(); }
});

test('header navigation remains readable in light and dark themes, including hover', async () => {
  const { context, page } = await isolatedPage(site.browser);
  try {
    await page.goto(site.base + '/docs/computer-architecture/basic/');
    for (const theme of ['light', 'dark']) {
      await page.locator('starlight-theme-select select').first().selectOption(theme);
      for (const link of await page.locator('.site-nav a:visible').all()) {
        for (const hover of [false, true]) {
          if (hover) await link.hover(); else await page.mouse.move(0,0);
          const contrast = await link.evaluate(el => {
            const luminance = color => {
              const channels = color.match(/[\d.]+/g).slice(0,3).map(Number).map(value => value/255).map(value => value<=.04045 ? value/12.92 : ((value+.055)/1.055)**2.4);
              return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;
            };
            const text = luminance(getComputedStyle(el).color);
            const background = luminance(getComputedStyle(document.querySelector('header.header')).backgroundColor);
            return (Math.max(text,background)+.05)/(Math.min(text,background)+.05);
          });
          assert.ok(contrast >= 4.5, `${theme}: ${await link.textContent()} hover=${hover}, contrast=${contrast}`);
        }
      }
    }
  } finally { await context.close(); }
});

test('shared header keeps branding and working search across custom and Starlight pages', async () => {
  const { context, page, errors, failures } = await isolatedPage(site.browser);
  try {
    let reference;
    for (const route of ['/', '/about/', '/blog/', '/docs/', '/docs/redis/cache/']) {
      await page.goto(site.base + route);
      const appearance = await page.locator('.site-title').evaluate(el => {
        const style = getComputedStyle(el), bounds = el.getBoundingClientRect();
        return { color: style.color, size: style.fontSize, weight: style.fontWeight, x: bounds.x, y: bounds.y };
      });
      reference ??= appearance;
      assert.deepEqual(appearance, reference, route);
      assert.equal(await page.locator('site-search').count(), 1);
      assert.equal(await page.locator('#theme-select').count(), 1);
      assert.equal(await page.locator('.header-navigation a[aria-current]').count(), 1);
      await page.locator('site-search button[data-open-modal]').click();
      const dialogBounds = await page.locator('site-search dialog').boundingBox();
      assert.ok(dialogBounds.x > 0 && dialogBounds.y >= 60, route);
      assert.ok(Math.abs(dialogBounds.x + dialogBounds.width/2 - 720) < 1, `${route}: search dialog must be centered`);
      await page.locator('site-search input').fill('Java');
      await page.waitForSelector('.pagefind-ui__result-link');
      assert.ok(await page.locator('.pagefind-ui__result-link:visible').count(), route);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('site-search dialog').evaluate(el => el.open), false);
    }
    assert.deepEqual(errors, []); assert.deepEqual(failures, []);
  } finally { await context.close(); }
});

test('responsive header retains navigation, theme and search without covering controls', async () => {
  const { context, page, errors, failures } = await isolatedPage(site.browser);
  try {
    for (const width of [800, 390, 320]) {
      await page.setViewportSize({width,height:844});
      for (const route of ['/', '/about/', '/blog/', '/docs/redis/cache/']) {
        await page.goto(site.base + route);
        await page.waitForLoadState('networkidle');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${width} ${route}`);
        const controls = page.locator('.site-title, .site-header-search button[data-open-modal], .header-theme .theme-picker');
        const boxes = await controls.evaluateAll(els => els.map(el => { const b=el.getBoundingClientRect(); return {left:b.left,right:b.right,top:b.top,bottom:b.bottom}; }));
        for (const [i, box] of boxes.entries()) {
          assert.ok(box.left>=0 && box.right<=width, `${width} ${route}`);
          if (i) assert.ok(box.left>=boxes[i-1].right, `${width} ${route}: header controls overlap`);
        }
        if (width < 800 && route !== '/docs/redis/cache/') {
          const menu = page.locator('site-mobile-menu button');
          await menu.click();
          assert.equal(await page.locator('site-mobile-menu .site-navigation a:visible').count(), 4);
          await page.keyboard.press('Escape');
          assert.equal(await menu.getAttribute('aria-expanded'), 'false');
          await menu.click();
        }
        await page.locator('.site-header-search button[data-open-modal]').click();
        assert.equal(await page.locator('site-search dialog').evaluate(el => el.open), true);
        if (width < 800 && route !== '/docs/redis/cache/') assert.equal(await page.locator('site-mobile-menu button').getAttribute('aria-expanded'), 'false');
        await page.locator('site-search input').fill('Java');
        await page.waitForSelector('.pagefind-ui__result-link');
        await page.keyboard.press('Escape');
      }
    }
    assert.deepEqual(errors, []); assert.deepEqual(failures, []);
  } finally { await context.close(); }
});

test('Docs fields flow vertically and home uses editorial dates without changing content URLs', async () => {
  const { context, page, errors } = await isolatedPage(site.browser);
  try {
    await page.goto(site.base + '/docs/');
    const fields = page.locator('.docs-tree > .docs-group');
    const positions = await fields.evaluateAll(nodes => nodes.map(node => { const b=node.getBoundingClientRect(); return {top:b.top,bottom:b.bottom}; }));
    for (let i=1; i<positions.length; i++) assert.ok(positions[i].top>positions[i-1].bottom, 'unrelated fields must not share a row');
    const first = fields.first().locator('.link-row');
    assert.equal(await first.count(), 4);
    assert.equal((await first.nth(0).boundingBox()).y, (await first.nth(1).boundingBox()).y);
    await page.goto(site.base + '/');
    assert.equal(await page.locator('.home-columns > section:first-child .preview-datestamp').count(), 3);
    assert.equal(await page.locator('.home-docs .content-preview').count(), 4);
    assert.notEqual(await page.locator('.home-docs').evaluate(el => getComputedStyle(el).backgroundColor), await page.locator('body').evaluate(el => getComputedStyle(el).backgroundColor));
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});
