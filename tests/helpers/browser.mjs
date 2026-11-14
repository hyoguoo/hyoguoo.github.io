import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { chromium } from 'playwright';

export async function startBrowser() {
  const server = spawn(process.execPath, ['node_modules/.bin/astro', 'preview', '--ignore-lock', '--host', '127.0.0.1', '--port', '4399'], { stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  server.stdout.on('data', data => { output += data; });
  server.stderr.on('data', data => { output += data; });
  const base = 'http://127.0.0.1:4399';
  try {
    for (let i = 0; ; i++) {
      try { if ((await fetch(base, { signal: AbortSignal.timeout(3000) })).ok) break; } catch {}
      if (i > 150 || server.exitCode !== null) throw new Error(`Preview failed: ${output}`);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    const browser = await chromium.launch();
    return { base, browser, async close() { await browser.close(); const exited = once(server, 'exit'); server.kill(); await exited; } };
  } catch (error) { server.kill(); throw error; }
}

export async function isolatedPage(browser, options = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce', ...options });
  // External behavior is exercised separately against live services. Keep regressions deterministic.
  await context.route('https://**/*', async route => {
    const url = route.request().url();
    if (url === 'https://giscus.app/client.js') return route.fulfill({ contentType: 'application/javascript', body: `const frame=document.createElement('iframe');frame.className='giscus-frame';frame.src='https://giscus.app/test-frame';document.getElementById('giscus-container').append(frame);` });
    if (url === 'https://giscus.app/test-frame') return route.fulfill({ contentType: 'text/html', body: `<script>addEventListener('message',e=>{if(e.data.giscus)parent.postMessage({testTheme:e.data.giscus.setConfig.theme},'*')})</script>` });
    if (route.request().resourceType() === 'image') return route.abort();
    return route.fulfill({ contentType: 'text/css', body: '' });
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.setDefaultNavigationTimeout(10000);
  const errors = [], failures = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error' && !message.text().startsWith('Failed to load resource')) errors.push(message.text()); });
  page.on('requestfailed', request => { if (request.url().startsWith('http://127.0.0.1')) failures.push(request.url()); });
  page.on('response', response => { if (response.url().startsWith('http://127.0.0.1') && response.status() >= 400) failures.push(`${response.status()} ${response.url()}`); });
  return { context, page, errors, failures };
}
