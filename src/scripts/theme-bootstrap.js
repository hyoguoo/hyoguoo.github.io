// @ts-check
// Synchronous first-paint initialization. Included verbatim by both HTML shells.
(() => {
  let stored;
  try { stored = localStorage.getItem('starlight-theme'); } catch { /* System preference. */ }
  document.documentElement.dataset.theme = stored === 'light' || stored === 'dark' ? stored
    : window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
})();
