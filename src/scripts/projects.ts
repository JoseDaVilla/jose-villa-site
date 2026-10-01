export {};

// Project dialogs: open from any [data-open] link, deep-link via #project-<id>,
// lazy-load live demos, and drive the screenshot carousel.

const PREFIX = '#project-';

function dialogFor(id: string): HTMLDialogElement | null {
  return document.querySelector<HTMLDialogElement>(`dialog[data-project="${CSS.escape(id)}"]`);
}

let opener: HTMLElement | null = null;

function open(id: string, from: HTMLElement | null) {
  const dlg = dialogFor(id);
  if (!dlg || dlg.open) return;
  opener = from;
  const frame = dlg.querySelector<HTMLIFrameElement>('iframe[data-src]');
  if (frame && !frame.src) frame.src = frame.dataset.src ?? '';
  dlg.showModal();
  dlg.scrollTop = 0;
  if (location.hash !== PREFIX + id) history.replaceState(null, '', PREFIX + id);
}

function onClose(dlg: HTMLDialogElement) {
  // Stop heavy WebGL demos when the window closes.
  const frame = dlg.querySelector<HTMLIFrameElement>('iframe[data-src]');
  if (frame) frame.removeAttribute('src');
  if (location.hash.startsWith(PREFIX)) history.replaceState(null, '', location.pathname + location.search);
  opener?.focus({ preventScroll: true });
  opener = null;
}

document.addEventListener('click', (e) => {
  const target = e.target as Element;
  const trigger = target.closest<HTMLElement>('[data-open]');
  if (trigger) {
    e.preventDefault();
    open(trigger.dataset.open!, trigger);
    return;
  }
  const dlg = target.closest<HTMLDialogElement>('dialog.pd');
  if (!dlg) return;
  if (target.closest('[data-close]') || target === dlg) dlg.close();
});

document.querySelectorAll<HTMLDialogElement>('dialog.pd').forEach((dlg) => {
  dlg.addEventListener('close', () => onClose(dlg));

  const carousel = dlg.querySelector<HTMLElement>('[data-carousel]');
  const track = carousel?.querySelector<HTMLElement>('[data-track]');
  if (!carousel || !track) return;
  const count = carousel.querySelector<HTMLElement>('[data-count]');
  const [prev, next] = carousel.querySelectorAll<HTMLButtonElement>('[data-step]');
  const total = track.children.length;
  const index = () => Math.round(track.scrollLeft / Math.max(track.clientWidth, 1));
  const sync = () => {
    const i = index();
    if (count) count.textContent = `${i + 1} / ${total}`;
    if (prev) prev.disabled = i === 0;
    if (next) next.disabled = i >= total - 1;
  };
  carousel.querySelectorAll<HTMLButtonElement>('[data-step]').forEach((b) =>
    b.addEventListener('click', () => {
      const i = Math.min(Math.max(index() + Number(b.dataset.step), 0), total - 1);
      track.scrollTo({ left: i * (track.clientWidth + 12), behavior: 'smooth' });
    }),
  );
  track.addEventListener('scroll', sync, { passive: true });
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') next?.click();
    if (e.key === 'ArrowLeft') prev?.click();
  });
  sync();
});

function fromHash() {
  if (location.hash.startsWith(PREFIX)) open(location.hash.slice(PREFIX.length), null);
}
window.addEventListener('hashchange', fromHash);
fromHash();
