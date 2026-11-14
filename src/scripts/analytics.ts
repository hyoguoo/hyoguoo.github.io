const measurementId = 'G-KBCBB0D7H8';


declare global { interface Window { dataLayer?: unknown[] } }

/** Preview/dev builds must never send production page views. */
export function initializeAnalytics(): void {
  if (!import.meta.env.PROD || location.hostname !== new URL(import.meta.env.SITE).hostname) return;
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  window.dataLayer ??= [];
  // gtag consumes an Arguments object, not an array.
  function gtag(..._args: unknown[]) { window.dataLayer!.push(arguments); }
  gtag('js', new Date());
  gtag('config', measurementId);
  document.head.append(script);
}
