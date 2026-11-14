import { reduce } from "./util";

export function initializeMotion(): void {
  if (reduce || !("IntersectionObserver" in window)) return;
  document.documentElement.classList.add("js-reveal");
  const observers: IntersectionObserver[] = [];
  function once(
    targets: string | Element[],
    callback: (element: Element) => void,
    options: IntersectionObserverInit = {
      rootMargin: "0px 0px -6% 0px",
      threshold: 0.04,
    },
  ) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          callback(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, options);
    observers.push(observer);
    (typeof targets === "string"
      ? document.querySelectorAll(targets)
      : targets
    ).forEach((element) => observer.observe(element));
  }
  once(".reveal", (element) => element.classList.add("in"));
  ["#stages", ".evo"].forEach((selector) => {
    const group = document.querySelector(selector);
    if (!group) return;
    group.classList.add("stagger");
    Array.from(group.children).forEach((child, index) => {
      if (child instanceof HTMLElement) {
        child.classList.add("st-i");
        child.style.setProperty("--i", String(index));
      }
    });
  });
  once(".stagger", (element) => element.classList.add("in"), {
    rootMargin: "0px 0px -8% 0px",
    threshold: 0.02,
  });
  const frames = new Set<number>();
  const frame = (callback: FrameRequestCallback) => {
    const id = requestAnimationFrame((time) => {
      frames.delete(id);
      callback(time);
    });
    frames.add(id);
  };
  const numberPattern = /^([+\-]?)(\d[\d,]*)(\.\d+)?$/;
  const metrics = Array.from(document.querySelectorAll(".s-metric-val")).filter(
    (element) =>
      element.firstChild?.nodeType === 3 &&
      numberPattern.test(element.firstChild.textContent?.trim() ?? ""),
  );
  once(
    metrics,
    (element) => {
      const raw = element.firstChild;
      const match = raw?.textContent?.trim().match(numberPattern);
      if (!raw || !match) return;
      const prefix = match[1],
        decimals = match[3] ? match[3].length - 1 : 0;
      const target = Number(match[2].replace(/,/g, "") + (match[3] ?? ""));
      const node = document.createTextNode(prefix + "0");
      element.replaceChild(node, raw);
      let start: number | undefined;
      function step(time: number) {
        start ??= time;
        const progress = Math.min(1, (time - start) / 1100);
        const value = target * (1 - (1 - progress) ** 3);
        node.textContent =
          prefix +
          (decimals
            ? value.toFixed(decimals)
            : Math.round(value).toLocaleString());
        if (progress < 1) frame(step);
      }
      frame(step);
    },
    { threshold: 0.6 },
  );
  const svg = document.querySelector("#archWrap svg.archmap");
  if (svg) {
    const paths = Array.from(
      svg.querySelectorAll<SVGPathElement>(".aedge:not(.dash)"),
    );
    paths.forEach((path, index) => {
      const length = path.getTotalLength();
      path.style.strokeDasharray = String(length);
      path.style.strokeDashoffset = String(length);
      path.style.transition =
        "stroke-dashoffset .85s cubic-bezier(.22,1,.36,1)";
      path.style.transitionDelay = `${index * 35}ms`;
    });
    once(
      [svg],
      () => {
        svg.classList.add("drawn");
        paths.forEach((path) => {
          path.style.strokeDashoffset = "0";
        });
      },
      { threshold: 0.25 },
    );
  }
  const timer = setTimeout(() => {
    document
      .querySelectorAll(".reveal:not(.in), .stagger:not(.in)")
      .forEach((element) => {
        if (element.getBoundingClientRect().top < window.innerHeight * 1.2)
          element.classList.add("in");
      });
  }, 2000);
  window.addEventListener("pagehide", (event) => {
    if (!event.persisted) {
      observers.forEach((observer) => observer.disconnect());
      clearTimeout(timer);
      frames.forEach((id) => cancelAnimationFrame(id));
    }
  });
}
