(() => {
  const splash = document.getElementById('astra-splash');
  const root = document.getElementById('root');
  const status = document.getElementById('boot-status');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const started = performance.now();
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  let finishing = false;
  const loop = setTimeout(() => splash.classList.add('is-waiting'), 1600);
  const watchdog = setTimeout(() => {
    if (finishing) return;
    splash.classList.add('is-error');
    status.textContent = 'Startup is taking longer than expected.';
    splash.querySelector('.boot-track').removeAttribute('role');
  }, 15000);
  window.astraBoot = {
    async ready() {
      if (finishing) return;
      finishing = true;
      clearTimeout(watchdog);
      splash.classList.remove('is-error');
      status.textContent = 'Preparing the interface';
      // Fonts may fail or stall offline; they must never prevent entry.
      await Promise.race([document.fonts.ready.catch(() => {}), sleep(1800)]);
      // Finish the supplied brand assembly, without pretending it measures loading.
      if (!reduced.matches) await sleep(Math.max(0, 1440 - (performance.now() - started)));
      clearTimeout(loop);
      splash.classList.add('is-ready');
      status.textContent = 'Your workspace is ready';
      splash.querySelector('.boot-track').setAttribute('aria-valuenow', '100');
      if (!reduced.matches) await sleep(160);
      root.removeAttribute('inert');
      root.classList.add('boot-enter');
      splash.classList.add('is-leaving');
      await sleep(reduced.matches ? 0 : 700);
      splash.remove();
      root.classList.remove('boot-enter');
      delete window.astraBoot;
    }
  };
})();
