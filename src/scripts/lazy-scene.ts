// Mount a 3D scene only when its host scrolls near the viewport, and only
// when the visitor allows motion and the browser has WebGL 2. Otherwise the
// host's flat SVG poster stays on screen.

type Mount = (host: HTMLElement) => unknown;

const allowed = (() => {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
})();

export function lazyScene(selector: string, load: () => Promise<Mount>) {
  if (!allowed) return;
  document.querySelectorAll<HTMLElement>(selector).forEach((host) => {
    const io = new IntersectionObserver(
      async ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const mount = await load();
        mount(host);
      },
      { rootMargin: '200px 0px' },
    );
    io.observe(host);
  });
}
