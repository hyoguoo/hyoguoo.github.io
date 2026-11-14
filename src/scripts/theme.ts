import { readStored, writeStored } from './storage.ts';
export type Theme = 'auto' | 'light' | 'dark';
export const parseTheme = (value: unknown): Theme => value === 'light' || value === 'dark' ? value : 'auto';

/** One controller synchronizes desktop/mobile Starlight pickers and custom pages. */
export function initializeTheme(): void {
  const media = window.matchMedia('(prefers-color-scheme: light)');
  let theme = parseTheme(readStored('starlight-theme'));
  const pickers = document.querySelectorAll<HTMLSelectElement>('#theme-select, starlight-theme-select select');
  function apply() {
    document.documentElement.dataset.theme = theme === 'auto' ? (media.matches ? 'light' : 'dark') : theme;
    pickers.forEach(select => { select.value = theme; });
  }
  pickers.forEach(select => select.addEventListener('change', () => {
    theme = parseTheme(select.value);
    writeStored('starlight-theme', theme === 'auto' ? '' : theme);
    apply();
  }));
  media.addEventListener('change', apply);
  window.addEventListener('storage', event => {
    if (event.key === 'starlight-theme' || event.key === null) {
      theme = parseTheme(event.newValue);
      apply();
    }
  });
  window.addEventListener('pageshow', apply);
  apply();
}
