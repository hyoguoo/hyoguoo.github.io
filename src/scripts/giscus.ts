export function initializeGiscus(): void {
  const container = document.getElementById('giscus-container');
  if (!container) return;
  const getTheme = () => document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
  const script = document.createElement('script');
  const attrs = {
    src: 'https://giscus.app/client.js',
    'data-repo': container.dataset.repo!, 'data-repo-id': container.dataset.repoId!,
    'data-category': container.dataset.category!, 'data-category-id': container.dataset.categoryId!,
    'data-mapping': 'pathname', 'data-strict': '0', 'data-reactions-enabled': '1',
    'data-emit-metadata': '0', 'data-input-position': 'top', 'data-theme': getTheme(),
    'data-lang': 'ko', crossorigin: 'anonymous',
  };
  script.async = true;
  Object.entries(attrs).forEach(([key, value]) => script.setAttribute(key, value));
  container.append(script);
  const frames = new WeakSet<HTMLIFrameElement>();
  function syncTheme() {
    const iframe = container!.querySelector<HTMLIFrameElement>('iframe.giscus-frame');
    if (!iframe) return;
    if (!frames.has(iframe)) {
      frames.add(iframe);
      iframe.addEventListener('load', syncTheme);
    }
    iframe.contentWindow?.postMessage({ giscus: { setConfig: { theme: getTheme() } } }, 'https://giscus.app');
  }
  const themeObserver = new MutationObserver(syncTheme);
  const frameObserver = new MutationObserver(syncTheme);
  const observe = () => {
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    frameObserver.observe(container!, { childList: true, subtree: true });
    syncTheme();
  };
  observe();
  window.addEventListener('pagehide', () => { themeObserver.disconnect(); frameObserver.disconnect(); });
  window.addEventListener('pageshow', observe);
}
