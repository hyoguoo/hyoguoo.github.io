/** Lazy load diagrams only on pages that use them. Serialize theme redraws. */
export async function initializeMermaid(): Promise<void> {
  const blocks = document.querySelectorAll<HTMLElement>('pre[data-language="mermaid"] code');
  if (!blocks.length) return;
  const { default: mermaid } = await import('mermaid');
  const diagrams: { host: HTMLElement; source: string; original: HTMLElement }[] = [];
  for (const code of blocks) {
    const pre = code.closest('pre');
    const original = pre?.closest<HTMLElement>('.expressive-code') ?? pre;
    if (!original) continue;
    const lines = code.querySelectorAll('.ec-line');
    const source = lines.length ? Array.from(lines, line => (line.textContent ?? '').replace(/\n$/, '')).join('\n').trim()
      : (code.textContent ?? '').trim();
    if (!source) continue;
    const host = document.createElement('div');
    host.className = 'mermaid-diagram not-content';
    host.style.cssText = 'overflow-x:auto;padding:1rem;text-align:center;';
    diagrams.push({ host, source, original });
  }
  let serial = 0;
  let pending = false;
  let running = false;
  async function render() {
    pending = true;
    if (running) return;
    running = true;
    try {
      while (pending) {
        pending = false;
        const theme = document.documentElement.dataset.theme === 'light' ? 'default' : 'dark';
        mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme });
        for (const diagram of diagrams) {
          try {
            const { svg, bindFunctions } = await mermaid.render(`mermaid-${++serial}`, diagram.source);
            if (!diagram.host.isConnected) {
              // Expressive Code assets may be shared by subsequent code blocks.
              diagram.original.querySelectorAll('link[rel="stylesheet"], script[src]').forEach(el => document.head.append(el));
              diagram.original.replaceWith(diagram.host);
            }
            diagram.host.innerHTML = svg;
            diagram.host.dataset.renderedTheme = theme;
            bindFunctions?.(diagram.host);
          } catch (error) {
            document.getElementById(`dmermaid-${serial}`)?.remove();
            console.error('Mermaid render error:', error);
          }
        }
      }
    } finally { running = false; }
  }
  const observer = new MutationObserver(() => { void render(); });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  // Keep bfcache restoration functional, and release observers during navigation.
  window.addEventListener('pagehide', () => observer.disconnect());
  window.addEventListener('pageshow', () => observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }));
  await render();
}
