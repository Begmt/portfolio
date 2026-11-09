/* Load the renderer only when About approaches the viewport. */
(() => {
  const root = document.getElementById('profile-avatar');
  if (!root) return;
  const status = root.querySelector('.avatar-status');
  const load = root.querySelector('.avatar-load');
  let pending = false, instance;
  const deferred = navigator.connection?.saveData;
  async function start() {
    if (pending || instance) return;
    pending = true;
    root.dataset.state = 'loading';
    root.setAttribute('aria-busy', 'true');
    load.hidden = true;
    status.textContent = 'Загружаю аватар…';
    try {
      const { mountAvatar } = await import('./assets/guide/avatar-renderer.js');
      instance = await mountAvatar(root);
      root.dataset.state = 'ready';
    } catch {
      root.dataset.state = 'error';
      status.textContent = '3D недоступно. Можно попробовать ещё раз.';
      load.textContent = 'Повторить загрузку 3D';
      load.hidden = false;
    } finally {
      root.removeAttribute('aria-busy');
      pending = false;
    }
  }
  load.addEventListener('click', start);
  if (deferred) {
    load.hidden = false;
    status.textContent = '3D по запросу · около 3 МБ';
  } else if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        observer.disconnect();
        start();
      }
    }, { rootMargin: '120px 0px' });
    observer.observe(root);
  } else {
    load.hidden = false;
    status.textContent = 'Загрузите аватар, чтобы познакомиться';
  }
})();
