/**
 * Pause-animations toggle behavior.
 *
 * - Single class (motion-paused) on <body> AND <html>.
 * - Persists to localStorage under 'motion-paused'.
 * - aria-pressed reflects current state.
 * - Init MUST NOT write storage. The pause-toggle module script and the
 *   motion-init head script aren't strictly ordered; if init wrote storage
 *   based on DOM state and ran before motion-init had applied the class,
 *   it would wipe the user's preference. So init only reads + syncs UI;
 *   storage writes happen only on click.
 */
export function initPauseToggle(button: HTMLButtonElement) {
  const writeUI = (paused: boolean) => {
    document.documentElement.classList.toggle('motion-paused', paused);
    document.body.classList.toggle('motion-paused', paused);
    button.setAttribute('aria-pressed', String(paused));
    button.querySelector('[data-label]')!.textContent = paused
      ? '■ animations paused'
      : '▸ pause animations';
  };

  const writeStorage = (paused: boolean) => {
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

  // Init: read from BOTH DOM (motion-init may have applied) AND localStorage
  // (in case motion-init hasn't run yet, or system pref is unset and the user
  // had previously paused). Either signal → paused. Sync UI only; do NOT
  // touch storage here.
  let storagePaused = false;
  try {
    storagePaused = localStorage.getItem('motion-paused') === '1';
  } catch {
    /* private-mode Safari etc. */
  }
  const initiallyPaused =
    document.body.classList.contains('motion-paused') || storagePaused;
  writeUI(initiallyPaused);

  button.addEventListener('click', () => {
    const next = !document.body.classList.contains('motion-paused');
    writeUI(next);
    writeStorage(next);
  });
}
