(() => {
'use strict';
const $ = id => document.getElementById(id);
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = (n, digits = 2) => Number(n).toLocaleString('ru-RU', {maximumFractionDigits: digits, minimumFractionDigits: digits});
const delta = n => `${n >= 0 ? '+' : '−'}${fmt(Math.abs(n))}`;
const storageKey = 'qala-hackalem-v2';
const state = {data: null, choices: [], active: 'transport', target: 'nura', district: 'nura', view: 'after', result: null, providers: null, changing: false, analyzing: false, teams: []};
let toastTimer;
function toast(message, error = false) {
  $('toast').textContent = message;
  $('toast').className = `toast show${error ? ' error' : ''}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('toast').classList.remove('show'), 5500);
}
async function api(path, body) {
  const response = await fetch(path, body === undefined ? {cache: 'no-store'} : {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)});
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Не удалось получить данные.');
  return result;
}
const action = id => state.data.actions.find(a => a.id === id);
const district = id => state.data.districts.find(d => d.id === id);
const category = id => state.data.categories.find(c => c.id === id);
const indicator = id => state.data.indicators.find(i => i.id === id);
const choiceLocation = choice => choice.district ? district(choice.district).name : 'Весь город';
function persist() {
  try { localStorage.setItem(storageKey, JSON.stringify({version:state.data.version, choices:state.choices, teams:state.teams})); }
  catch { toast('Браузер не смог сохранить сценарий. Можно скачать паспорт.', true); }
}
async function setChoices(candidate, message) {
  if (state.changing) return false;
  state.changing = true;
  renderButtons();
  try {
    const result = await api('/api/simulate', {choices:candidate});
    state.choices = result.choices;
    state.result = result;
    state.providers = null;
    persist();
    render();
    if (message) toast(message);
    return true;
  } catch (e) { toast(e.message, true); return false; }
  finally { state.changing = false; renderButtons(); }
}
function renderButtons() {
  if (!state.data) return;
  document.querySelectorAll('[data-add],[data-remove],[data-preset],#reset-button,#example-button,#apply-recommendation,.team-load').forEach(b => b.disabled = state.changing);
  $('analyze-button').disabled = !state.result?.complete || state.analyzing || state.changing;
  $('analyze-button').innerHTML = state.analyzing ? 'AI анализирует… <span>◌</span>' : 'AI-разбор стратегии <span>↗</span>';
  $('ai-progress').textContent = state.analyzing ? 'NVIDIA проверяет риски, OpenAI готовит объяснение. Обычно до минуты.' : 'Числа считает модель. ИИ объясняет решения.';
}
function renderNav() {
  $('category-nav').innerHTML = state.data.categories.map(c => {
    const count = state.choices.filter(x => action(x.action).category === c.id).length;
    return `<button class="category-tab ${state.active === c.id ? 'active' : ''}" data-category="${c.id}" aria-pressed="${state.active === c.id}"><span>${c.icon}</span>${c.name}<b>${count}/2</b></button>`;
  }).join('');
  $('category-nav').querySelectorAll('button').forEach(b => b.onclick = () => { state.active = b.dataset.category; renderNav(); renderCatalog(); });
}
function renderCatalog() {
  const d = district(state.target);
  const metrics = state.data.indicators.filter(i => i.category === state.active);
  const weak = metrics.reduce((a,b) => d.scores[a.id] < d.scores[b.id] ? a : b);
  $('district-briefing').innerHTML = `<strong>В фокусе: ${d.name}</strong><p>${d.note} ${weak.name}: <b>${fmt(d.scores[weak.id], 0)}/100</b> на старте.</p>`;
  $('action-list').innerHTML = state.data.actions.filter(a => a.category === state.active).map(a => {
    const selected = state.choices.find(c => c.action === a.id);
    const fraction = (state.data.horizon - a.lag) / state.data.horizon;
    return `<article class="action-card ${selected ? 'selected' : ''}"><div class="action-top"><span class="action-id">${a.id}</span><span>${a.scope === 'city' ? '◎ Весь город' : '⌖ Один район'}</span></div><h3>${a.name}</h3><div class="action-effects">${Object.entries(a.effects).map(([k,v]) => `<span class="effect ${v < 0 ? 'negative' : ''}" title="${indicator(k).name}">${k} ${delta(v * fraction)}</span>`).join('')}</div><p class="action-delay">Лаг ${a.lag} кв. · реализуется ${fmt(fraction * 100, 1)}%</p><div class="quarter-track" aria-hidden="true">${Array.from({length:8}, (_,i) => `<i class="${i >= a.lag ? 'on' : ''}"></i>`).join('')}</div><div class="action-bottom"><span class="action-cost">${a.cost}<small> усл. ед.</small></span><button class="add-action" data-add="${a.id}">${selected ? 'Убрать −' : 'В план +'}</button></div><p class="action-scope">${selected ? `✓ В плане: ${choiceLocation(selected)}` : `Цель: ${a.scope === 'city' ? 'все 5 районов' : d.name}`}</p></article>`;
  }).join('');
  $('action-list').querySelectorAll('[data-add]').forEach(b => b.onclick = () => {
    const a = action(b.dataset.add);
    const existing = state.choices.some(c => c.action === a.id);
    const next = existing ? state.choices.filter(c => c.action !== a.id) : [...state.choices, a.scope === 'city' ? {action:a.id} : {action:a.id, district:state.target}];
    setChoices(next, existing ? `${a.id} удалено из плана` : `${a.id} добавлено в план`);
  });
  renderButtons();
}
function renderDashboard() {
  const r = state.result;
  $('remaining-value').textContent = r.remaining;
  $('spent-value').textContent = `${r.spent} / ${r.budget} использовано`;
  $('budget-segments').innerHTML = state.choices.map(c => `<span style="width:${action(c.action).cost}%;background:${category(action(c.action).category).color}" title="${c.action}: ${action(c.action).cost} усл. ед."></span>`).join('');
  $('plan-list').innerHTML = Array.from({length:5}, (_,i) => {
    const c = state.choices[i];
    return c ? `<li><span class="slot-number">0${i+1}</span><div class="plan-copy"><strong>${action(c.action).name}</strong><small>${c.action} · ${choiceLocation(c)} · ${action(c.action).cost} ед.</small></div><button class="plan-remove" data-remove="${c.action}" aria-label="Убрать ${action(c.action).name}">×</button></li>` : `<li class="empty"><span class="slot-number">0${i+1}</span><span>Место для следующего решения</span></li>`;
  }).join('');
  $('plan-list').querySelectorAll('[data-remove]').forEach(b => b.onclick = () => setChoices(state.choices.filter(c => c.action !== b.dataset.remove)));
  $('synergy-list').innerHTML = r.synergies.map(s => `<div class="synergy-item">✦ ${s.pair.join(' + ')} · ${district(s.district).name} · ${Object.entries(s.effects).map(([k,v]) => `${k} +${v}`).join(', ')}</div>`).join('');
  $('score-value').textContent = fmt(r.projected_score);
  $('score-mode').textContent = r.complete ? 'ИТОГОВЫЙ SCORE' : r.decisions ? 'ПРОГНОЗ ЧЕРНОВИКА' : 'БАЗОВЫЙ УРОВЕНЬ';
  $('score-delta').textContent = `${delta(r.gain)} к базе`;
  $('baseline-value').textContent = fmt(r.baseline_score);
  const f = r.formula;
  $('formula-breakdown').innerHTML = `<span><b>${fmt(f.city_average)}</b>город × 0.7</span><span><b>${fmt(f.weakest_district)}</b>минимум × 0.3</span><span><b>−${f.critical_count}</b>за значения &lt; 40</span>`;
  $('completion-hint').textContent = r.complete ? '5/5 · План допустим. Итог по формуле датасета.' : `${r.decisions}/5 · Добавьте ещё ${5-r.decisions} реш. Итоговый Score пока не присваивается.`;
}
const mapShapes = [
  {id:'saryarka', points:'58,52 200,29 220,120 161,171 37,144', x:126,y:94},
  {id:'baikonur', points:'211,30 358,47 386,137 268,166 229,121', x:297,y:95},
  {id:'almaty', points:'396,144 477,177 479,289 356,303 305,221 276,179', x:399,y:213},
  {id:'esil', points:'165,190 229,149 270,181 299,231 339,304 212,330 145,272', x:235,y:245},
  {id:'nura', points:'35,162 147,186 127,268 194,335 62,318 20,237', x:89,y:237},
];
function renderAtlas() {
  const r = state.result;
  const before = state.view === 'before';
  $('city-map').innerHTML = `<svg viewBox="0 0 510 355" role="group" aria-label="Пять районов Астаны"><path d="M-10 152Q85 173 145 178T255 160Q320 145 387 139T529 144" fill="none" stroke="#78b2b2" stroke-width="5" opacity=".6"/><path d="M-10 145Q85 166 145 171T255 153Q320 138 387 132T529 137" fill="none" stroke="#78b2b2" stroke-width="1" opacity=".5"/>${mapShapes.map(s => {
    const d = r.districts.find(d => d.id === s.id);
    const scores = before ? d.baseline_scores : d.scores;
    const critical = Object.values(scores).some(v => v < 40);
    return `<g class="map-region ${state.district === s.id ? 'selected' : ''} ${critical ? 'critical' : ''}" data-district="${s.id}" role="button" tabindex="0" aria-pressed="${state.district === s.id}" aria-label="${d.name}: ${fmt(before ? d.before : d.after)}, ${critical ? 'есть критические показатели' : 'нет критических показателей'}"><polygon points="${s.points}"/><text class="map-name" x="${s.x}" y="${s.y-13}" text-anchor="middle">${d.name}</text><text class="map-value" x="${s.x}" y="${s.y+13}" text-anchor="middle">${fmt(before ? d.before : d.after)}</text><text class="map-delta" x="${s.x}" y="${s.y+31}" text-anchor="middle">${before ? `${Math.round(district(s.id).population_share*100)}% населения` : `${delta(d.delta)} к базе`}</text></g>`;
  }).join('')}</svg>`;
  $('city-map').querySelectorAll('[data-district]').forEach(g => {
    const select = () => { state.district = g.dataset.district; renderAtlas(); };
    g.onclick = select;
    g.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(); } };
  });
  const d = r.districts.find(d => d.id === state.district);
  const source = district(d.id);
  $('district-detail').innerHTML = `<div class="district-heading"><div><span class="eyebrow">${Math.round(source.population_share*100)}% НАСЕЛЕНИЯ ГОРОДА</span><h3>${d.name}</h3></div><div class="district-total">${fmt(before ? d.before : d.after)}<small>${before ? 'индекс на старте' : `${delta(d.delta)} к базе`}</small></div></div><p>${source.note}</p><div class="indicator-list">${state.data.indicators.map(i => {
    const value = before ? d.baseline_scores[i.id] : d.scores[i.id];
    return `<div class="indicator-row ${value < 40 ? 'critical' : ''}"><span><small>${i.id}</small>${i.name}</span><div class="indicator-track"><span class="value" style="width:${value}%"></span><i class="marker" title="Критический порог 40"></i></div><span class="values">${!before && value !== d.baseline_scores[i.id] ? `<em>${d.baseline_scores[i.id]} →</em>` : ''}${fmt(value, value % 1 ? 2 : 0)}</span></div>`;
  }).join('')}</div>`;
  const critical = before ? state.data.baseline.critical : r.critical;
  $('critical-strip').className = `critical-strip${critical.length ? '' : ' clear'}`;
  $('critical-strip').innerHTML = `<strong>${critical.length ? `−${critical.length}` : '✓'}</strong><div><b>${critical.length ? 'Критические показатели снижают Score' : 'Все показатели достигли порога 40'}</b><span>${critical.length ? critical.map(c => `${district(c.district).name}: ${indicator(c.indicator).name} ${fmt(c.value)}`).join(' · ') : 'В этом сценарии штраф за критические значения равен нулю.'}</span></div>`;
}
function renderResults() {
  const r = state.result;
  $('result-section').hidden = !r.complete;
  if (!r.complete) return;
  $('result-summary').textContent = r.analysis.summary;
  for (const [id, values] of [['strength-list',r.analysis.strengths],['risk-list',r.analysis.risks]]) $(id).innerHTML = values.map(v => `<li>${esc(v)}</li>`).join('');
  $('consequence-text').textContent = r.analysis.consequence;
  $('recommend-text').textContent = r.recommendation?.text || 'Среди допустимых замен одного решения улучшение не найдено. Попробуйте другой набор из нескольких мер.';
  $('apply-recommendation').hidden = !r.recommendation;
  renderProviders();
}
const providerErrors = {unconfigured:'Ключ не настроен на сервере.',auth_error:'Ошибка авторизации (401). Провайдер отклонил ключ; проверьте ключ и доступ в личном кабинете.',access_denied:'Доступ к модели запрещён (403).',model_unavailable:'Модель недоступна (410).',rate_limited:'Превышен лимит запросов (429).',timeout:'Истекло время ожидания ответа.',network_error:'Не удалось подключиться к провайдеру.',api_error:'Провайдер вернул ошибку.',error:'Провайдер не вернул текст.'};
function renderProviders() {
  if (!state.providers) {
    $('provider-content').innerHTML = '<p class="micro">AI-разбор ещё не запрошен. Нажмите кнопку в блоке Score для объяснения от OpenAI и проверки рисков от NVIDIA.</p>';
    return;
  }
  $('provider-content').innerHTML = ['openai','nvidia'].map(key => {
    const p = state.providers[key];
    const ok = p?.status === 'ok';
    return `<section class="provider ${ok ? '' : 'failed'}"><h4>${key === 'openai' ? 'OPENAI / ОБЪЯСНЕНИЕ СТРАТЕГИИ' : 'NVIDIA / ГИПОТЕЗА О РИСКАХ'} · ${ok ? 'ГОТОВО' : 'НЕДОСТУПЕН'}</h4><p>${esc(ok ? p.text : providerErrors[p?.status] || 'Не удалось получить ответ.')}</p>${!ok ? '<p class="micro">Расчёт по датасету доступен выше и не зависит от ответа API.</p>' : ''}</section>`;
  }).join('');
}
function renderTeams() {
  const teams = [...state.teams].sort((a,b) => b.score-a.score);
  $('teams-list').innerHTML = teams.length ? teams.map((t,i) => `<article class="team-card panel"><div class="panel-top"><span class="team-rank">СЦЕНАРИЙ / ${String(i+1).padStart(2,'0')}</span><button data-delete="${esc(t.id)}" aria-label="Удалить ${esc(t.name)}">×</button></div><h3>${esc(t.name)}</h3><div class="team-score">${fmt(t.score)} <small>${delta(t.gain)} к базе</small></div><div class="team-facts">Бюджет: ${t.spent}/100 · Резерв: ${100-t.spent}<br>Критических показателей: ${t.critical}<br>${esc(t.choices.map(c => c.action).join(' · '))}</div><button class="team-load" data-load="${esc(t.id)}">Открыть и изменить →</button></article>`).join('') : '<div class="empty-state">Нет сохранённых сценариев. Выберите пять мер и сохраните результат.</div>';
  $('teams-list').querySelectorAll('[data-delete]').forEach(b => b.onclick = () => {state.teams = state.teams.filter(t => t.id !== b.dataset.delete);persist();renderTeams();});
  $('teams-list').querySelectorAll('[data-load]').forEach(b => b.onclick = async () => {
    const team = state.teams.find(t => t.id === b.dataset.load);
    if (await setChoices(team.choices, 'Сценарий загружен')) $('workspace').scrollIntoView({behavior:'smooth'});
  });
  renderButtons();
}
function render() { renderNav(); renderCatalog(); renderDashboard(); renderAtlas(); renderResults(); renderTeams(); renderButtons(); }
function renderStatic() {
  $('target-district').innerHTML = state.data.districts.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
  $('target-district').value = state.target;
  $('presets').innerHTML = state.data.presets.map((p,i) => `<button class="preset" data-preset="${p.id}"><small>СТАРТОВАЯ СТРАТЕГИЯ / 0${i+1}</small><strong>${p.name}</strong><p>${p.description}</p></button>`).join('');
  $('presets').querySelectorAll('button').forEach(b => b.onclick = () => setChoices(state.data.presets.find(p => p.id === b.dataset.preset).choices, 'Стратегия загружена. Любую меру можно заменить.'));
  $('source-table').innerHTML = `<table><caption class="sr-only">Исходные показатели районов и веса индикаторов</caption><thead><tr><th scope="col">Район</th><th scope="col">Население</th>${state.data.indicators.map(i => `<th scope="col" title="${i.name}">${i.id}</th>`).join('')}<th scope="col">Индекс D</th></tr></thead><tbody>${state.data.districts.map(d => `<tr><th scope="row">${d.name}</th><td>${Math.round(d.population_share*100)}%</td>${state.data.indicators.map(i => `<td>${d.scores[i.id]}</td>`).join('')}<td>${fmt(state.data.baseline.districts.find(x => x.id === d.id).before)}</td></tr>`).join('')}<tr><th scope="row">Вес показателя</th><td>—</td>${state.data.indicators.map(i => `<td>${fmt(i.weight)}</td>`).join('')}<td>Σ = 1</td></tr></tbody></table>`;
}
function exportPassport() {
  const r = state.result;
  if (!r.complete) return;
  const name = $('team-name').value.trim() || 'Сценарий QALA LAB';
  const html = `<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(name)} — паспорт сценария</title><style>body{font:15px/1.6 system-ui,sans-serif;max-width:1000px;margin:40px auto;padding:0 24px;color:#20372b}h1{font-size:40px;line-height:1.1}h2{margin-top:32px}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border-bottom:1px solid #ced5c8;padding:10px;text-align:left}th{background:#e5eddc}.lead{padding:24px;background:#e5eddc;font-size:22px}.note{color:#5e6e60;font-size:12px}.scroll{overflow:auto}@media print{body{margin:0}h2,tr{break-inside:avoid}}</style><body><p>QALA.LAB / HACKALEM AI</p><h1>${esc(name)}</h1><p class="lead">Score ${fmt(r.score)} · ${delta(r.gain)} к базе<br>Бюджет ${r.spent}/100 · Резерв ${r.remaining} усл. ед.</p><p>5 решений · Горизонт 8 кварталов · Учебный датасет</p><h2>План мероприятий</h2><div class="scroll"><table><thead><tr><th>Мера</th><th>Территория</th><th>Стоимость</th><th>Лаг</th><th>Эффекты с лагом</th></tr></thead><tbody>${r.contributions.map(c => `<tr><td>${c.action} · ${esc(c.name)}</td><td>${c.district ? district(c.district).name : 'Весь город'}</td><td>${c.cost}</td><td>${c.lag} кв.</td><td>${Object.entries(c.effects).map(([k,v]) => `${k} ${delta(v)}`).join(', ')}</td></tr>`).join('')}</tbody></table></div><p>Синергии: ${r.synergies.length ? r.synergies.map(s => `${s.pair.join(' + ')} (${district(s.district).name}): ${Object.entries(s.effects).map(([k,v]) => `${k} +${v}`).join(', ')}`).join('; ') : 'нет'}.</p><h2>Районы до и после</h2><table><thead><tr><th>Район</th><th>До</th><th>После</th><th>Изменение</th></tr></thead><tbody>${r.districts.map(d => `<tr><td>${d.name}</td><td>${fmt(d.before)}</td><td>${fmt(d.after)}</td><td>${delta(d.delta)}</td></tr>`).join('')}</tbody></table><h2>Все показатели после решений</h2><div class="scroll"><table><thead><tr><th>Район</th>${state.data.indicators.map(i => `<th>${i.id}</th>`).join('')}</tr></thead><tbody>${r.districts.map(d => `<tr><td>${d.name}</td>${state.data.indicators.map(i => `<td>${fmt(d.scores[i.id])}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="note">${state.data.indicators.map(i => `${i.id} — ${i.name}`).join('; ')}.</p><h2>Расчёт результата</h2><p>0.7 × ${fmt(r.formula.city_average,4)} + 0.3 × ${fmt(r.formula.weakest_district,4)} − ${r.formula.critical_count} = ${fmt(r.score)} (округлено).</p><h2>Сильные стороны и риски</h2><ul>${[...r.analysis.strengths,...r.analysis.risks].map(s => `<li>${esc(s)}</li>`).join('')}</ul><p>${esc(r.analysis.consequence)}</p>${state.providers ? ['openai','nvidia'].map(k => state.providers[k]?.status === 'ok' ? `<h2>${k === 'openai' ? 'OpenAI — объяснение' : 'NVIDIA — гипотеза о рисках'}</h2><p>${esc(state.providers[k].text)}</p>` : '').join('') : ''}<p class="note">Источник: task/Датасет районов.docx. Не официальный прогноз. Бюджет в условных единицах. Расчёт воспроизводится по исходным значениям, весам, лагам, синергиям и правилам датасета. Ответ AI не изменяет Score.</p></body></html>`;
  const url = URL.createObjectURL(new Blob([html], {type:'text/html;charset=utf-8'}));
  const a = document.createElement('a');a.href = url;a.download = 'qala-scenario.html';document.body.append(a);a.click();a.remove();setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('Паспорт скачан. Откройте HTML или распечатайте в PDF.');
}
async function init() {
  $('load-status').hidden = false;
  $('load-status-text').textContent = 'Загружаем каталог мероприятий…';
  $('retry-button').hidden = true;
  try {
    state.data = await api('/api/bootstrap');
    if (state.data.version !== 'hackalem-districts-v2') {
      throw new Error('На этом порту работает старая версия сервера. Перезапустите server.py или откройте http://127.0.0.1:8001.');
    }
    state.result = state.data.baseline;
    renderStatic();render();
    $('load-status').hidden = true;
    let stored;
    try { stored = JSON.parse(localStorage.getItem(storageKey) || 'null'); } catch { /* A broken browser draft must not block startup. */ }
    if (stored?.version === state.data.version) {
      // Recalculate stored scores on the server: stale or edited browser values never enter the ranking.
      if (Array.isArray(stored.teams)) {
        const restored = await Promise.all(stored.teams.slice(0,30).map(async (t, index) => {
          if (!t || typeof t.name !== 'string') return null;
          try {
            const r = await api('/api/simulate', {choices:t.choices});
            if (!r.complete) return null;
            return {id:`restored-${index}`,name:t.name.slice(0,40),score:r.score,gain:r.gain,spent:r.spent,critical:r.formula.critical_count,choices:r.choices};
          } catch { return null; }
        }));
        state.teams = restored.filter(Boolean);
      }
      if (Array.isArray(stored.choices) && stored.choices.length) await setChoices(stored.choices);
      renderTeams();
    }
    $('target-district').onchange = e => {state.target = e.target.value;renderCatalog();};
    $('reset-button').onclick = () => setChoices([], 'План очищен. Общие стартовые условия восстановлены.');
    $('example-button').onclick = async () => {if (await setChoices(state.data.presets[0].choices)) $('workspace').scrollIntoView({behavior:'smooth'});};
    document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => {
      state.view = b.dataset.view;
      document.querySelectorAll('[data-view]').forEach(x => {x.classList.toggle('active', x === b);x.setAttribute('aria-pressed', String(x === b));});
      renderAtlas();
    });
    $('analyze-button').onclick = async () => {
      if (!state.result.complete || state.analyzing || state.changing) return;
      const snapshot = JSON.stringify(state.choices);
      state.analyzing = true;renderButtons();
      $('result-section').scrollIntoView({behavior:'smooth'});
      try {
        const r = await api('/api/analyze', {choices:JSON.parse(snapshot)});
        if (snapshot !== JSON.stringify(state.choices)) {toast('План изменился. Запросите AI-разбор для текущего набора.');return;}
        state.providers = r.providers;renderProviders();toast('Анализ завершён. Статус каждого API указан в брифинге.');
      } catch (e) {toast(e.message, true);}
      finally {state.analyzing = false;renderButtons();}
    };
    $('apply-recommendation').onclick = () => {if (state.result.recommendation) setChoices(state.result.recommendation.choices, 'Замена применена. Score пересчитан.');};
    $('save-form').onsubmit = e => {
      e.preventDefault();
      if (!state.result.complete || state.changing) return;
      const name = $('team-name').value.trim();
      if (!name) {toast('Укажите название сценария.',true);return;}
      const r = state.result;
      state.teams.push({id:`${Date.now()}-${Math.random().toString(16).slice(2)}`, name:name.slice(0,40), score:r.score, gain:r.gain, spent:r.spent, critical:r.formula.critical_count, choices:structuredClone(state.choices)});
      state.teams = state.teams.slice(-30);persist();renderTeams();toast('Сценарий сохранён в этом браузере.');
    };
    $('export-button').onclick = exportPassport;
  } catch (e) {
    $('load-status').hidden = false;
    $('load-status-text').textContent = `Не удалось загрузить симулятор. ${e.message}`;
    $('retry-button').hidden = false;
    $('completion-hint').textContent = 'Каталог не загружен. Причина указана над списком мероприятий.';
  }
}
$('retry-button').onclick = init;
init();

})();
