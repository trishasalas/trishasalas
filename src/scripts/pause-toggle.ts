/**
 * Pause-animations toggle behavior.
 *
 * - Single class (motion-paused) on <body> AND <html>.
 * - Persists to localStorage under 'motion-paused'.
 * - aria-pressed reflects current state.
 * - Respects initial state set by motion-init.ts (which runs in <head>).
 */
export function initPauseToggle(button: HTMLButtonElement) {
  const setState = (paused: boolean) => {
    document.documentElement.classList.toggle('motion-paused', paused);
    document.body.classList.toggle('motion-paused', paused);
    button.setAttribute('aria-pressed', String(paused));
    button.querySelector('[data-label]')!.textContent = paused
      ? '■ animations paused'
      : '▸ pause animations';
    try {
      if (paused) {
        localStorage.setItem('motion-paused', '1');
      } else {
        localStorage.removeItem('motion-paused');
      }
    } catch {
      /* private-mode Safari etc. — toggle still works in-session */
    }
  };

  // Initialize from current DOM state (motion-init may have already applied it)
  const initiallyPaused = document.body.classList.contains('motion-paused');
  setState(initiallyPaused);

  button.addEventListener('click', () => {
    const next = !document.body.classList.contains('motion-paused');
    setState(next);
  });
}
