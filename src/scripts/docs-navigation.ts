/** Keep the active document visible without scrolling the article itself. */
export class DocsNavigation extends HTMLElement {
  private scroller: HTMLElement | null = null;
  private revealCurrent = () => {
    const current = this.querySelector<HTMLElement>('a[aria-current="page"]');
    if (!current || !this.scroller?.clientHeight) return;
    const bounds = current.getBoundingClientRect();
    const viewport = this.scroller.getBoundingClientRect();
    if (bounds.top < viewport.top || bounds.bottom > viewport.bottom) {
      this.scroller.scrollTop += bounds.top - viewport.top - this.scroller.clientHeight * .35;
    }
  };

  connectedCallback() {
    this.scroller = this.closest<HTMLElement>('#starlight__sidebar');
    this.scroller?.addEventListener('toggle', this.revealCurrent);
    this.revealCurrent();
  }

  disconnectedCallback() {
    this.scroller?.removeEventListener('toggle', this.revealCurrent);
    this.scroller = null;
  }
}

if (!customElements.get('docs-navigation')) customElements.define('docs-navigation', DocsNavigation);
