// Browser-only SVG and HTML helpers. No collection/build-time module imports this file.
export const reduce = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
export function esc(value: unknown): string {
  const entities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return String(value).replace(/[&<>"']/g, (char) => entities[char]);
}
export function escBr(value: unknown): string {
  return esc(value).replace(/\n/g, "<br>");
}
export function chips(values?: string[]): string {
  return (values ?? [])
    .map((value) => `<span class="chip">${esc(value)}</span>`)
    .join("");
}
export function sv<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number>,
): SVGElementTagNameMap[K] {
  const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
  Object.entries(attrs).forEach(([key, value]) =>
    element.setAttribute(key, String(value)),
  );
  return element;
}
export function requiredElement(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing portfolio element: #${id}`);
  return element;
}
export const CV: Record<string, string> = {
  ready: "--st-ready",
  inprog: "--st-inprog",
  done: "--st-done",
  failed: "--st-failed",
  quar: "--st-quar",
  expired: "--st-expired",
  recover: "--st-recover",
  payment: "--svc-payment",
  pg: "--svc-pg",
  product: "--svc-product",
  user: "--svc-user",
  infra: "--svc-infra",
};
