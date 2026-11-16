(() => {
  const system = matchMedia('(prefers-color-scheme: dark)');
  const apply = () => {
    let choice = null;
    try {
      choice = localStorage.getItem('flownoteTheme');
    } catch {}
    document.documentElement.classList.toggle('dark', choice === 'dark' || (choice !== 'light' && system.matches));
    globalThis.chrome?.storage?.local.set({ flownoteTheme: choice ?? 'system' });
  };
  apply();
  system.addEventListener('change', apply);
  addEventListener('storage', (event) => {
    if (event.key === null || event.key === 'flownoteTheme') apply();
  });
})();
