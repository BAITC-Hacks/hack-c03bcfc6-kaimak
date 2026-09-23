const $ = (selector) => document.querySelector(selector);
const state = {
  data: null,
  choices: {},
  active: 'transport',
  district: 'north',
  preview: null,
  analysis: null,
  previewRequest: 0,
  busy: false,
  teams: [],
};

const format = (value) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(value);
const actionById = (id) => state.data.actions.find((item) => item.id === id);
const districtById = (id) => state.data.districts.find((item) => item.id === id);
const categoryById = (id) => state.data.categories.find((item) => item.id === id);

function toast(message, error = false) {
  const box = $('#toast');
  box.textContent = message;
  box.classList.toggle('error', error);
  box.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => box.classList.remove('show'), 3800);
}

async function api(route, payload) {
  const response = await fetch(route, {
    method: payload ? 'POST' : 'GET',
    headers: payload ? { 'Content-Type': 'application/json' } : {},
    body: payload ? JSON.stringify(payload) : undefined,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Ошибка сервера');
  return data;
}

function spentFor(choices) {
  return Object.values(choices).reduce((sum, choice) => sum + actionById(choice.action).cost, 0);
}

function weakestDistrict(categoryId) {
  return [...state.data.districts].sort((a, b) => a.scores[categoryId] - b.scores[categoryId])[0].id;
}

function chooseAction(actionId) {
  const action = actionById(actionId);
  if (!action) return;
  const current = state.choices[state.active];
  const next = { ...state.choices, [state.active]: { action: actionId, district: current?.district || weakestDistrict(state.active) } };
  if (spentFor(next) > state.data.budget) {
    toast(`Бюджет превышен на ${format(spentFor(next) - state.data.budget)} млн ₸. Измените другое решение.`, true);
    return;
  }
  state.choices = next;
  refreshScenario();
}

function chooseTarget(districtId) {
  if (!state.choices[state.active] || !districtById(districtId)) return;
  state.choices[state.active] = { ...state.choices[state.active], district: districtId };
  state.district = districtId;
  refreshScenario();
}

function refreshScenario() {
  state.analysis = null;
  $('#result-section').hidden = true;
  renderNavigation();
  renderDecision();
  renderBudget();
  renderScore();
  const requestId = ++state.previewRequest;
  api('/api/simulate', { choices: state.choices }).then((result) => {
    if (requestId !== state.previewRequest) return;
    state.preview = result;
    renderScore();
    renderDistricts();
  }).catch((error) => {
    if (requestId === state.previewRequest) toast(error.message, true);
  });
}

function renderNavigation() {
  $('#decision-count').textContent = `${Object.keys(state.choices).length} / 5 РЕШЕНИЙ`;
  $('#category-nav').innerHTML = state.data.categories.map((category, index) => `
    <button type="button" class="nav-item ${state.active === category.id ? 'active' : ''}" data-category="${category.id}" aria-current="${state.active === category.id ? 'step' : 'false'}">
      <span class="nav-number">0${index + 1}</span><span class="nav-label">${category.name}</span><span class="nav-check">${state.choices[category.id] ? '✓' : '·'}</span>
    </button>`).join('');
}

function renderDecision() {
  const category = categoryById(state.active);
  const index = state.data.categories.indexOf(category);
  const choice = state.choices[state.active];
  const actions = state.data.actions.filter((item) => item.category === state.active);
  $('#decision-content').innerHTML = `
    <div class="decision-head"><div class="decision-heading"><span class="category-icon">${category.icon}</span><div><span class="step-label">РЕШЕНИЕ 0${index + 1} / 05</span><h3>${category.name}</h3></div></div><span class="current-badge">${choice ? '✓ ВЫБРАНО' : 'ОЖИДАЕТ ВЫБОРА'}</span></div>
    <p class="decision-intro">Выберите одно мероприятие. Стоимость списывается из общего бюджета команды.</p>
    <div class="action-list">${actions.map((action) => `<button type="button" class="action-card ${choice?.action === action.id ? 'selected' : ''}" data-action="${action.id}" aria-pressed="${choice?.action === action.id}"><span class="action-radio"></span><span class="action-copy"><strong>${action.name}</strong><small>${action.description}</small><span class="action-tag">${action.tag}</span></span><span class="action-price">${format(action.cost)}<small>млн ₸</small></span></button>`).join('')}</div>
    <div class="district-picker"><div class="picker-title"><span>Где реализовать?</span><small>${choice ? 'Выберите целевой район' : 'Сначала выберите мероприятие'}</small></div><div class="district-options">${state.data.districts.map((district) => `<button type="button" class="district-chip ${choice?.district === district.id ? 'active' : ''}" data-target="${district.id}" ${choice ? '' : 'disabled'}>${district.name}</button>`).join('')}</div></div>
    <div class="decision-foot"><span>Прямой эффект в выбранном районе, часть эффекта — в остальных.</span><button type="button" class="next-button" data-next="true">${index === 4 ? 'К результату' : 'Следующее направление'} →</button></div>`;
}

function renderBudget() {
  const spent = spentFor(state.choices);
  const remaining = state.data.budget - spent;
  $('#remaining-value').textContent = format(remaining);
  $('#spent-value').textContent = `${format(spent)} млн ₸`;
  $('#budget-percent').textContent = `${Math.round(spent / state.data.budget * 100)}%`;
  $('#budget-fill').style.width = `${spent / state.data.budget * 100}%`;
  $('#budget-fill').classList.toggle('warning', remaining < 100);
}

function renderScore() {
  const result = state.preview || state.data.baseline;
  $('#score-value').textContent = format(result.score);
  $('#score-delta').textContent = result.gain > 0 ? `↗ +${format(result.gain)} к исходному` : 'Исходное состояние города';
  $('#baseline-value').textContent = `База: ${format(result.baseline_score)}`;
  $('#metric-bars').innerHTML = state.data.categories.map((category) => {
    const value = result.city[category.id];
    return `<div class="metric-row"><div class="metric-row-top"><span>${category.short}</span><b>${format(value.after)}</b></div><div class="metric-track"><span class="metric-base" style="width:${value.before}%"></span><span class="metric-current" style="width:${value.after}%"></span></div></div>`;
  }).join('');
  const complete = Object.keys(state.choices).length === 5;
  $('#analyze-button').disabled = !complete || state.busy;
  $('#analyze-button').innerHTML = state.busy ? 'Анализируем сценарий…' : 'Получить AI-разбор <span aria-hidden="true">↗</span>';
  $('#analyze-hint').textContent = complete ? 'Все пять направлений заполнены' : `Осталось решений: ${5 - Object.keys(state.choices).length}`;
}

function renderDistricts() {
  const result = state.preview || state.data.baseline;
  $('#map-tiles').innerHTML = state.data.districts.map((district) => {
    const score = result.districts.find((item) => item.id === district.id);
    return `<button type="button" class="map-tile ${state.district === district.id ? 'active' : ''}" data-map="${district.id}" aria-label="Район ${district.name}, показатель ${format(score.after)}"><strong>${format(score.after)}</strong><small>${district.name}</small></button>`;
  }).join('');
  const district = districtById(state.district);
  const score = result.districts.find((item) => item.id === district.id);
  $('#district-detail').innerHTML = `<span class="panel-overline">ПРОФИЛЬ РАЙОНА</span><h3>${district.name}<span class="district-delta">${score.delta ? `+${format(score.delta)}` : ''}</span></h3><p>${district.note}</p><div class="district-stats"><div>НАСЕЛЕНИЕ<strong>${format(district.population / 1000)} тыс.</strong></div><div>ИНДЕКС РАЙОНА<strong>${format(score.after)} / 100</strong></div></div><div class="district-score-list">${state.data.categories.map((category) => `<div class="district-score-line"><span>${category.short}</span><span class="district-mini-track"><span style="width:${score.scores[category.id]}%"></span></span><b>${format(score.scores[category.id])}</b></div>`).join('')}</div>`;
}

function listInto(selector, items) {
  const list = $(selector);
  list.replaceChildren(...items.map((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    return li;
  }));
}

function renderAnalysis() {
  const result = state.analysis;
  if (!result) return;
  $('#result-section').hidden = false;
  $('#result-summary').textContent = result.analysis.summary;
  $('#consequence-text').textContent = result.analysis.consequence;
  listInto('#strength-list', result.analysis.strengths);
  listInto('#risk-list', result.analysis.risks);
  const openai = result.providers?.openai || { status: 'unconfigured', text: null };
  const nvidia = result.providers?.nvidia || { status: 'unconfigured', text: null };
  const active = [openai.status === 'ok' && 'OpenAI', nvidia.status === 'ok' && 'NVIDIA'].filter(Boolean);
  $('#analysis-mode').textContent = active.length ? `Локальный агент + ${active.join(' + ')}` : 'Локальный аналитический агент';
  $('#openai-block').hidden = !openai.text;
  $('#llm-narrative').textContent = openai.text || '';
  $('#nvidia-block').hidden = !nvidia.text;
  $('#nvidia-review').textContent = nvidia.text || '';
  const failureText = {
    auth_error: 'отклонил авторизацию (401). Проверьте ключ и доступ к API в аккаунте провайдера.',
    access_denied: 'запретил доступ (403). Проверьте разрешения аккаунта.',
    model_unavailable: 'сообщил, что выбранная модель недоступна (410).',
    rate_limited: 'временно ограничил частоту запросов (429).',
    timeout: 'не ответил до истечения времени ожидания.',
    network_error: 'недоступен из этой сети.',
    api_error: 'не вернул пригодный ответ.',
  };
  const failures = [['OpenAI', openai], ['NVIDIA', nvidia]]
    .filter(([, provider]) => provider.status !== 'ok' && provider.status !== 'unconfigured')
    .map(([name, provider]) => `${name} ${failureText[provider.status] || failureText.api_error}`);
  $('#provider-status').textContent = failures.length ? `${failures.join(' ')} Локальный анализ остаётся доступен.` : '';
  $('#recommend-text').textContent = result.recommendation?.text || 'Среди всех допустимых замен одного решения агент не нашёл варианта с более высоким Score. Попробуйте изменить сразу несколько решений.';
  $('#apply-recommendation').hidden = !result.recommendation;
  $('#result-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function loadTeams() {
  try {
    const saved = JSON.parse(localStorage.getItem('qala-teams-v1') || '[]');
    state.teams = Array.isArray(saved) ? saved.filter((item) => item && typeof item.name === 'string' && Number.isFinite(item.score)).slice(0, 30) : [];
  } catch { state.teams = []; }
}

function renderTeams() {
  const list = $('#teams-list');
  list.replaceChildren();
  const sorted = [...state.teams].sort((a, b) => b.score - a.score || a.spent - b.spent);
  $('#teams-count').textContent = `${sorted.length} СЦЕНАРИЕВ`;
  if (!sorted.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-teams';
    empty.innerHTML = '<span>◎</span><p>Пока нет сохранённых результатов.<br>Соберите первый сценарий команды.</p>';
    list.append(empty);
    return;
  }
  sorted.forEach((team, index) => {
    const card = document.createElement('article');
    card.className = 'team-card';
    const top = document.createElement('div'); top.className = 'team-card-top';
    const rank = document.createElement('span'); rank.className = 'team-rank'; rank.textContent = `#${String(index + 1).padStart(2, '0')} / КОМАНДА`;
    const remove = document.createElement('button'); remove.className = 'team-delete'; remove.type = 'button'; remove.textContent = '×'; remove.setAttribute('aria-label', `Удалить ${team.name}`); remove.addEventListener('click', () => { state.teams = state.teams.filter((item) => item.id !== team.id); localStorage.setItem('qala-teams-v1', JSON.stringify(state.teams)); renderTeams(); });
    top.append(rank, remove);
    const name = document.createElement('h3'); name.textContent = team.name;
    const score = document.createElement('div'); score.className = 'team-score'; score.textContent = format(team.score); const unit = document.createElement('small'); unit.textContent = ' / 100'; score.append(unit);
    const bottom = document.createElement('div'); bottom.className = 'team-card-bottom';
    const gain = document.createElement('span'); gain.textContent = `↗ +${format(team.gain)} к базе`;
    const spent = document.createElement('b'); spent.textContent = `${format(team.spent)} млн ₸`;
    bottom.append(gain, spent); card.append(top, name, score, bottom);
    if (team.choices) {
      const load = document.createElement('button'); load.className = 'team-load'; load.type = 'button'; load.textContent = 'Открыть сценарий →';
      load.addEventListener('click', () => {
        state.choices = structuredClone(team.choices);
        state.active = 'transport';
        refreshScenario();
        $('#workspace').scrollIntoView({ behavior: 'smooth' });
        toast(`Сценарий «${team.name}» загружен.`);
      });
      card.append(load);
    }
    list.append(card);
  });
}

async function analyze() {
  if (Object.keys(state.choices).length !== 5 || state.busy) return;
  state.busy = true;
  renderScore();
  const snapshot = JSON.stringify(state.choices);
  try {
    const result = await api('/api/analyze', { choices: state.choices });
    if (snapshot !== JSON.stringify(state.choices)) return;
    state.analysis = result;
    state.preview = result;
    renderScore(); renderDistricts(); renderAnalysis();
  } catch (error) { toast(error.message, true); }
  finally { state.busy = false; renderScore(); }
}

function loadExample() {
  state.choices = {
    transport: { action: 'bus', district: 'east' },
    green: { action: 'park', district: 'north' },
    social: { action: 'hubs', district: 'south' },
    safety: { action: 'lighting', district: 'east' },
    service: { action: 'onewindow', district: 'south' },
  };
  state.active = 'transport';
  state.district = 'east';
  refreshScenario();
  $('#workspace').scrollIntoView({ behavior: 'smooth', block: 'start' });
  toast('Пример сценария загружен. Все решения можно изменить.');
}

function wireEvents() {
  $('#category-nav').addEventListener('click', (event) => {
    const button = event.target.closest('[data-category]');
    if (!button) return;
    state.active = button.dataset.category;
    renderNavigation(); renderDecision();
  });
  $('#decision-content').addEventListener('click', (event) => {
    const action = event.target.closest('[data-action]');
    const target = event.target.closest('[data-target]');
    if (action) chooseAction(action.dataset.action);
    else if (target) chooseTarget(target.dataset.target);
    else if (event.target.closest('[data-next]')) {
      const index = state.data.categories.findIndex((item) => item.id === state.active);
      if (index < 4) { state.active = state.data.categories[index + 1].id; renderNavigation(); renderDecision(); }
      else if (Object.keys(state.choices).length === 5) $('#analyze-button').scrollIntoView({ behavior: 'smooth', block: 'center' });
      else toast('Для анализа нужны все пять решений.', true);
    }
  });
  $('#map-tiles').addEventListener('click', (event) => { const button = event.target.closest('[data-map]'); if (button) { state.district = button.dataset.map; renderDistricts(); } });
  $('#example-button').addEventListener('click', loadExample);
  $('#reset-button').addEventListener('click', () => {
    state.choices = {};
    state.active = 'transport';
    state.district = 'north';
    refreshScenario();
    toast('Сценарий сброшен к исходным условиям.');
  });
  $('#analyze-button').addEventListener('click', analyze);
  $('#apply-recommendation').addEventListener('click', () => {
    const item = state.analysis?.recommendation;
    if (!item) return;
    state.choices[item.category] = { action: item.action, district: item.district };
    state.active = item.category; state.district = item.district;
    refreshScenario();
    $('#workspace').scrollIntoView({ behavior: 'smooth' });
    toast('Рекомендация применена. Запустите анализ ещё раз.');
  });
  $('#save-team').addEventListener('click', () => {
    if (!state.analysis) return;
    const name = $('#team-name').value.trim();
    if (!name) { toast('Введите название команды.', true); $('#team-name').focus(); return; }
    state.teams.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, name, score: state.analysis.score, gain: state.analysis.gain, spent: state.analysis.spent, choices: structuredClone(state.choices) });
    state.teams = state.teams.slice(-30);
    localStorage.setItem('qala-teams-v1', JSON.stringify(state.teams));
    $('#team-name').value = '';
    renderTeams();
    toast('Сценарий команды сохранён.');
    $('#teams-section').scrollIntoView({ behavior: 'smooth' });
  });
}

async function start() {
  try {
    state.data = await api('/api/bootstrap');
    state.preview = state.data.baseline;
    $('#brief-budget').textContent = `${format(state.data.budget)} млн ₸`;
    loadTeams(); wireEvents(); renderNavigation(); renderDecision(); renderBudget(); renderScore(); renderDistricts(); renderTeams();
  } catch (error) {
    toast(`Не удалось загрузить симулятор: ${error.message}`, true);
    $('#decision-content').textContent = 'Не удалось загрузить данные. Обновите страницу или перезапустите сервер.';
  }
}

start();
