/** Bind before/after image completion: cached failures can precede module loading. */
export function initializeStats(): void {
  const section = document.getElementById('stats-section');
  if (!section) return;
  const items = Array.from(section.querySelectorAll<HTMLElement>('.stats-item'));
  section.querySelectorAll<HTMLImageElement>('img').forEach(img => {
    const hideFailed = () => {
      const item = img.closest<HTMLElement>('.stats-item');
      if (item) item.style.display = 'none';
      if (items.every(item => item.style.display === 'none')) section.style.display = 'none';
    };
    img.addEventListener('error', hideFailed, { once: true });
    if (img.complete && img.naturalWidth === 0) hideFailed();
  });
}
