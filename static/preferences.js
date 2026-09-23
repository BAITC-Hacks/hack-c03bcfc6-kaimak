(() => {
  let preferences = {};
  try { preferences = JSON.parse(localStorage.getItem('qala-preferences-v1') || '{}') || {}; } catch {}
  document.documentElement.dataset.theme = preferences.theme === 'night' ? 'night' : 'studio';
  document.documentElement.lang = ['ru','en','kk'].includes(preferences.lang) ? preferences.lang : 'ru';
})();
