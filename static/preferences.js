(() => {
  let preferences = {};
  try { preferences = JSON.parse(localStorage.getItem('qala-preferences-v1') || '{}') || {}; } catch {}
  document.documentElement.dataset.theme = ['paper','night','studio'].includes(preferences.theme) ? preferences.theme : 'paper';
  document.documentElement.lang = ['ru','en','kk'].includes(preferences.lang) ? preferences.lang : 'ru';
})();
