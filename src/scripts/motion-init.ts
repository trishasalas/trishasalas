/**
 * Runs synchronously in <head> before <body> exists. We can't query
 * <body> directly yet, so we set a flag on document.documentElement and
 * an inline observer flips <body> the moment it's parsed.
 *
 * Two triggers, single class:
 *   1. prefers-reduced-motion: reduce  (system)
 *   2. localStorage 'motion-paused'='1' (user)
 */
(() => {
  const prefersReduced = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;
  // Wrapped: a thrown localStorage error in <head> would abort the whole
  // script, dropping the prefers-reduced-motion path. Fall back to the
  // system signal alone if storage is unavailable.
  let userPaused = false;
  try {
    userPaused = localStorage.getItem('motion-paused') === '1';
  } catch {
    /* private-mode Safari etc. — system pref still wins */
  }
  const paused = prefersReduced || userPaused;

  if (!paused) return;

  // Apply ASAP to <html>, then propagate to <body> when it parses.
  document.documentElement.classList.add('motion-paused');

  if (document.body) {
    document.body.classList.add('motion-paused');
  } else {
    document.addEventListener(
      'DOMContentLoaded',
      () => document.body.classList.add('motion-paused'),
      { once: true },
    );
  }
})();
