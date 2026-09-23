(() => {
'use strict';
const $ = id => document.getElementById(id);
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state = {data:null, choices:[], active:'transport', target:'nura', district:'nura', view:'after', result:null, providers:{}, changing:false, analyzing:false, teams:[], lang:document.documentElement.lang, theme:document.documentElement.dataset.theme};
const storageKey = 'qala-hackalem-v2';
const locale = () => ({ru:'ru-RU',en:'en-GB',kk:'kk-KZ'}[state.lang]);
let translations = {};
const initialMessages = {
  ru:{loading:'Загружаем каталог…',networkError:'Нет связи с сервером. Проверьте, запущен ли server.py.',serverError:'Не удалось обработать запрос.',loadFailed:'Не удалось загрузить симулятор. {reason}',notLoaded:'Каталог не загружен. Нажмите «Повторить загрузку».'},
  en:{loading:'Loading catalogue…',networkError:'Cannot reach the server. Make sure server.py is running.',serverError:'The request could not be processed.',loadFailed:'Could not load the simulator. {reason}',notLoaded:'Catalogue unavailable. Try loading again.'},
  kk:{loading:'Тізім жүктелуде…',networkError:'Сервермен байланыс жоқ. server.py іске қосылғанын тексеріңіз.',serverError:'Сұрауды өңдеу мүмкін болмады.',loadFailed:'Симулятор жүктелмеді. {reason}',notLoaded:'Тізім жүктелмеді. Қайта жүктеп көріңіз.'},
};
function t(key,values={}) {
  const text=translations[state.lang]?.[key] ?? initialMessages[state.lang]?.[key] ?? key;
  return text.replace(/\{(\w+)\}/g,(_,k)=>String(values[k] ?? `{${k}}`));
}
const fmt = (n,digits=2) => Number(n).toLocaleString(locale(),{maximumFractionDigits:digits,minimumFractionDigits:digits});
const delta = n => `${n>=0?'+':'−'}${fmt(Math.abs(n))}`;
const nameOf = id => t(id);
const action = id => state.data.actions.find(a=>a.id===id);
const district = id => state.data.districts.find(d=>d.id===id);
const category = id => state.data.categories.find(c=>c.id===id);
const choiceLocation = c => c.district ? nameOf(c.district) : t('citywide');
let toastTimer, city3d=null, city3dLoading=false, city3dStatus='loading3d', booting=false;
function toast(message,error=false) { $('toast').textContent=message; $('toast').className=`toast show${error?' error':''}`;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),5500); }
async function api(path,body) {
  let response;
  try { response=await fetch(path,body===undefined?{cache:'no-store'}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); }
  catch { throw new Error(t('networkError')); }
  let result;
  try {result=await response.json();} catch {throw new Error(t('serverError'));}
  if(!response.ok)throw new Error(result.error_code ? t(result.error_code,result.error_params || {}) : t('serverError'));
  return result;
}
function persist() {
  try {localStorage.setItem(storageKey,JSON.stringify({version:state.data.version,choices:state.choices,teams:state.teams}));}
  catch {toast(t('storageFailed'),true);}
}
function savePreferences() {
  try {localStorage.setItem('qala-preferences-v1',JSON.stringify({lang:state.lang,theme:state.theme}));}
  catch {toast(t('storageFailed'),true);}
}
function translatePage() {
  document.documentElement.lang=state.lang;
  if(!translations[state.lang])return;
  document.title=`QALA LAB — ${t('appTitle')}`;
  document.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=t(el.dataset.i18n));
  document.querySelectorAll('[data-i18n-aria]').forEach(el=>el.setAttribute('aria-label',t(el.dataset.i18nAria)));
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>el.placeholder=t(el.dataset.i18nPlaceholder));
  updatePreferenceButtons();
  if(city3dStatus){$('city3d-status').textContent=t(city3dStatus);}
  if(booting)$('load-status-text').textContent=t('loading');
}
function updatePreferenceButtons() {
  const labels = {
    ru:['Сменить язык', 'Включить светлую тему', 'Включить тёмную тему'],
    en:['Change language', 'Switch to light theme', 'Switch to dark theme'],
    kk:['Тілді ауыстыру', 'Ашық тақырыпқа ауысу', 'Қараңғы тақырыпқа ауысу'],
  }[state.lang];
  $('language-code').textContent={ru:'RU',en:'EN',kk:'KZ'}[state.lang];
  const languageLabel=`${labels[0]}: ${{ru:'Русский → English',en:'English → Қазақша',kk:'Қазақша → Русский'}[state.lang]}`;
  const themeLabel=labels[state.theme==='night'?1:2];
  for(const [id,label] of [['language-toggle',languageLabel],['theme-toggle',themeLabel]]) {
    $(id).setAttribute('aria-label',label);$(id).title=label;
  }
}
function applyTheme() {
  updatePreferenceButtons();
  document.documentElement.dataset.theme=state.theme;
  document.querySelector('meta[name="theme-color"]').content={night:'#101d22',studio:'#f2effb'}[state.theme];
  if(city3d)city3d.setAppearance({theme:state.theme,locale:locale(),translate:t});
}
async function setChoices(candidate,message) {
  if(state.changing||booting)return false;
  state.changing=true;renderButtons();
  try {
    const r=await api('/api/simulate',{choices:candidate});
    state.choices=r.choices;state.result=r;state.providers={};persist();render();
    if(message)toast(message);return true;
  } catch(e){toast(e.message,true);return false;}
  finally{state.changing=false;renderButtons();}
}
function renderButtons() {
  document.querySelectorAll('[data-add],[data-remove],[data-preset],#reset-button,#example-button,#apply-recommendation,.team-load').forEach(b=>b.disabled=state.changing||booting);
  $('analyze-button').disabled=!state.result?.complete||state.analyzing||state.changing||booting;
  if(!translations[state.lang])return;
  $('analyze-button').innerHTML=`${esc(t(state.analyzing?'aiBusy':'analyze'))} <span>${state.analyzing?'◌':'↗'}</span>`;
  $('ai-progress').textContent=t(state.analyzing?'aiProgress':'aiHint');
}
function renderNav() {
  $('category-nav').innerHTML=state.data.categories.map(c=>`<button class="category-tab ${state.active===c.id?'active':''}" data-category="${c.id}" aria-pressed="${state.active===c.id}"><span>${c.icon}</span>${esc(nameOf(c.id))}<b>${state.choices.filter(x=>action(x.action).category===c.id).length}/2</b></button>`).join('');
  $('category-nav').querySelectorAll('button').forEach(b=>b.onclick=()=>{state.active=b.dataset.category;renderNav();renderCatalog();});
}
function renderCatalog() {
  const d=district(state.target),metrics=state.data.indicators.filter(i=>i.category===state.active);
  const weak=metrics.reduce((a,b)=>d.scores[a.id]<d.scores[b.id]?a:b);
  $('district-briefing').innerHTML=`<strong>${esc(t('focus',{name:nameOf(d.id)}))}</strong><p>${esc(t(`note_${d.id}`))} ${esc(nameOf(weak.id))}: <b>${fmt(d.scores[weak.id],0)}/100</b> ${esc(t('atStart'))}.</p>`;
  $('action-list').innerHTML=state.data.actions.filter(a=>a.category===state.active).map(a=>{
    const chosen=state.choices.find(c=>c.action===a.id),fraction=(state.data.horizon-a.lag)/state.data.horizon;
    return `<article class="action-card ${chosen?'selected':''}"><div class="action-top"><span class="action-id">${a.id}</span><span>${a.scope==='city'?'◎':'⌖'} ${esc(t(a.scope==='city'?'citywide':'oneDistrict'))}</span></div><h3>${esc(nameOf(a.id))}</h3><div class="action-effects">${Object.entries(a.effects).map(([k,v])=>`<span class="effect ${v<0?'negative':''}" title="${esc(nameOf(k))}">${k} ${delta(v*fraction)}</span>`).join('')}</div><p class="action-delay">${esc(t('delayEffect',{lag:a.lag,percent:fmt(fraction*100,1)}))}</p><div class="quarter-track" aria-hidden="true">${Array.from({length:8},(_,i)=>`<i class="${i>=a.lag?'on':''}"></i>`).join('')}</div><div class="action-bottom"><span class="action-cost">${a.cost}<small> ${esc(t('units'))}</small></span><button class="add-action" data-add="${a.id}">${esc(t(chosen?'remove':'addPlan'))}${chosen?' −':''}</button></div><p class="action-scope">${chosen?'✓ ':''}${esc(t(chosen?'inPlan':'target',{name:chosen?choiceLocation(chosen):a.scope==='city'?t('allDistricts'):nameOf(d.id)}))}</p></article>`;
  }).join('');
  $('action-list').querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{
    const a=action(b.dataset.add),exists=state.choices.some(c=>c.action===a.id);
    const choices=exists?state.choices.filter(c=>c.action!==a.id):[...state.choices,a.scope==='city'?{action:a.id}:{action:a.id,district:state.target}];
    setChoices(choices,t(exists?'removed':'added',{id:a.id}));
  });renderButtons();
}
function renderDashboard() {
  const r=state.result;
  $('remaining-value').textContent=fmt(r.remaining,0);$('spent-value').textContent=t('spentOf',{spent:r.spent,budget:r.budget});
  $('budget-segments').innerHTML=state.choices.map(c=>`<span style="width:${action(c.action).cost}%;background:${category(action(c.action).category).color}" title="${c.action}: ${action(c.action).cost} ${esc(t('units'))}"></span>`).join('');
  $('plan-list').innerHTML=Array.from({length:5},(_,i)=>{
    const c=state.choices[i];return c?`<li><span class="slot-number">0${i+1}</span><div class="plan-copy"><strong>${esc(nameOf(c.action))}</strong><small>${c.action} · ${esc(choiceLocation(c))} · ${action(c.action).cost} ${esc(t('units'))}</small></div><button class="plan-remove" data-remove="${c.action}" aria-label="${esc(t('remove')+' '+nameOf(c.action))}">×</button></li>`:`<li class="empty"><span class="slot-number">0${i+1}</span><span>${esc(t('emptySlot'))}</span></li>`;
  }).join('');
  $('plan-list').querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>setChoices(state.choices.filter(c=>c.action!==b.dataset.remove)));
  $('synergy-list').innerHTML=r.synergies.map(s=>`<div class="synergy-item">✦ ${s.pair.join(' + ')} · ${esc(nameOf(s.district))} · ${Object.entries(s.effects).map(([k,v])=>`${k} +${v}`).join(', ')}</div>`).join('');
  $('score-value').textContent=fmt(r.projected_score);$('score-mode').textContent=t(r.complete?'finalScore':r.decisions?'draftScore':'baselineLevel');
  $('score-delta').textContent=t('vsBase',{value:delta(r.gain)});$('baseline-value').textContent=fmt(r.baseline_score);
  const f=r.formula;
  $('formula-breakdown').innerHTML=`<span><b>${fmt(f.city_average)}</b>${esc(t('cityWeight'))}</span><span><b>${fmt(f.weakest_district)}</b>${esc(t('minWeight'))}</span><span><b>−${f.critical_count}</b>${esc(t('criticalPenalty'))}</span>`;
  $('completion-hint').textContent=r.complete?t('planValid'):t('planIncomplete',{count:r.decisions,left:5-r.decisions});
}
const mapShapes=[
{id:'saryarka',points:'58,52 200,29 220,120 161,171 37,144',x:126,y:94},
{id:'baikonur',points:'211,30 358,47 386,137 268,166 229,121',x:297,y:95},
{id:'almaty',points:'396,144 477,177 479,289 356,303 305,221 276,179',x:399,y:213},
{id:'esil',points:'165,190 229,149 270,181 299,231 339,304 212,330 145,272',x:235,y:245},
{id:'nura',points:'35,162 147,186 127,268 194,335 62,318 20,237',x:89,y:237},
];
function chooseDistrict(id){state.district=id;state.target=id;$('target-district').value=id;renderCatalog();renderAtlas();}
function renderAtlas() {
  const r=state.result,before=state.view==='before';
  if(city3d){try{city3d.setAppearance({theme:state.theme,locale:locale(),translate:t});city3d.update(r,state.view,state.district);}catch{city3dFailure();}}
  $('city-map').innerHTML=`<svg viewBox="0 0 510 355" role="group" aria-label="${esc(t('fiveDistricts'))}"><path d="M-10 152Q85 173 145 178T255 160Q320 145 387 139T529 144" fill="none" stroke="#78b2b2" stroke-width="5" opacity=".6"/>${mapShapes.map(s=>{
    const d=r.districts.find(x=>x.id===s.id),scores=before?d.baseline_scores:d.scores,critical=Object.values(scores).some(v=>v<40);
    return `<g class="map-region ${state.district===s.id?'selected':''} ${critical?'critical':''}" data-district="${s.id}" role="button" tabindex="0" aria-pressed="${state.district===s.id}" aria-label="${esc(nameOf(s.id))}: ${fmt(before?d.before:d.after)}, ${esc(t(critical?'hasCritical':'noCritical'))}"><polygon points="${s.points}"/><text class="map-name" x="${s.x}" y="${s.y-15}" text-anchor="middle">${esc(nameOf(d.id))}</text><text class="map-value" x="${s.x}" y="${s.y+13}" text-anchor="middle">${fmt(before?d.before:d.after)}</text><text class="map-delta" x="${s.x}" y="${s.y+33}" text-anchor="middle">${esc(before?t('populationShare',{value:Math.round(district(s.id).population_share*100)}):delta(d.delta))}</text></g>`;
  }).join('')}</svg>`;
  $('city-map').querySelectorAll('[data-district]').forEach(g=>{g.onclick=()=>chooseDistrict(g.dataset.district);g.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();chooseDistrict(g.dataset.district);}};});
  const d=r.districts.find(d=>d.id===state.district),source=district(d.id);
  $('district-detail').innerHTML=`<div class="district-heading"><div><span class="eyebrow">${esc(t('populationShare',{value:Math.round(source.population_share*100)}))}</span><h3>${esc(nameOf(d.id))}</h3></div><div class="district-total">${fmt(before?d.before:d.after)}<small>${esc(before?t('baselineIndex'):t('vsBase',{value:delta(d.delta)}))}</small></div></div><p>${esc(t(`note_${d.id}`))}</p><div class="indicator-list">${state.data.indicators.map(i=>{
    const v=before?d.baseline_scores[i.id]:d.scores[i.id];return `<div class="indicator-row ${v<40?'critical':''}"><span><small>${i.id}</small>${esc(nameOf(i.id))}</span><div class="indicator-track"><span class="value" style="width:${v}%"></span><i class="marker" title="${esc(t('criticalThreshold'))}"></i></div><span class="values">${!before&&v!==d.baseline_scores[i.id]?`<em>${fmt(d.baseline_scores[i.id],0)} →</em>`:''}${fmt(v,v%1?2:0)}</span></div>`;
  }).join('')}</div>`;
  const critical=before?state.data.baseline.critical:r.critical;
  $('critical-strip').className=`critical-strip${critical.length?'':' clear'}`;
  $('critical-strip').innerHTML=`<strong>${critical.length?`−${critical.length}`:'✓'}</strong><div><b>${esc(t(critical.length?'criticalTitle':'criticalClear'))}</b><span>${critical.length?critical.map(c=>`${esc(nameOf(c.district))}: ${esc(nameOf(c.indicator))} ${fmt(c.value)}`).join(' · '):esc(t('criticalZero'))}</span></div>`;
}
function setMapMode(mode) {
  const use3D=mode==='3d';$('city3d-host').hidden=!use3D;$('city-map').hidden=use3D;$('city3d-controls').hidden=!use3D;
  for(const [id,active] of [['mode-3d',use3D],['mode-2d',!use3D]]){$(id).classList.toggle('active',active);$(id).setAttribute('aria-pressed',String(active));}
  if(city3d)city3d.setVisible(use3D);
}
function city3dFailure() {
  if(city3d){city3d.dispose();city3d=null;}setMapMode('2d');$('city3d-host').replaceChildren();city3dStatus='no3d';$('city3d-status').textContent=t(city3dStatus);$('city3d-status').hidden=false;
}
async function initCity3D() {
  if(city3d){setMapMode('3d');return;}if(city3dLoading||!state.result)return;
  city3dLoading=true;city3dStatus='loading3d';$('city3d-status').hidden=false;$('city3d-status').textContent=t(city3dStatus);
  try {
    const {createCity3D}=await import('/city3d.js?v=3');setMapMode('3d');
    city3d=createCity3D($('city3d-host'),{onSelect:chooseDistrict,onFailure:city3dFailure});
    city3d.setAppearance({theme:state.theme,locale:locale(),translate:t});city3d.update(state.result,state.view,state.district);
    city3dStatus=null;$('city3d-status').hidden=true;
  } catch{city3dFailure();}finally{city3dLoading=false;}
}
// Presentation only: all numbers below come from the server's deterministic result.
function analysisFor(r) {
  const weakest=r.districts.reduce((a,b)=>a.after<b.after?a:b),largest=r.districts.reduce((a,b)=>a.delta>b.delta?a:b);
  const strengths=[t('strongest',{name:nameOf(largest.id),gain:delta(largest.delta)}),t('criticalCount',{count:r.formula.critical_count})];
  if(r.synergies.length)strengths.push(t('synergyActive',{pairs:r.synergies.map(s=>s.pair.join(' + ')).join(', ')}));
  const risks=[t('weakest',{name:nameOf(weakest.id),score:fmt(weakest.after)}),t('reserveRisk',{amount:r.remaining})];
  for(const c of r.contributions){const negatives=Object.entries(c.effects).filter(([,v])=>v<0);if(negatives.length)risks.push(t('negativeEffect',{id:c.action,effects:negatives.map(([k,v])=>`${k} ${delta(v)}`).join(', ')}));}
  return {summary:t('summary',{score:fmt(r.score),gain:delta(r.gain),spent:r.spent}),strengths,risks,consequence:t('consequence')};
}
function recommendationText(r) {
  const rec=r.recommendation;if(!rec)return t('noImprovement');
  const old=rec.old_action || r.choices.find(c=>!rec.choices.some(n=>n.action===c.action&&n.district===c.district))?.action;
  const next=rec.replacement || rec.choices.find(c=>!r.choices.some(n=>n.action===c.action&&n.district===c.district));
  if(!old||!next)return t('noImprovement');
  return t('recommendText',{old,id:next.action,name:nameOf(next.action),district:choiceLocation(next),score:fmt(rec.score),gain:delta(rec.improvement),remaining:rec.remaining});
}
function renderResults() {
  const r=state.result;$('result-section').hidden=!r.complete;if(!r.complete)return;
  const analysis=analysisFor(r);$('result-summary').textContent=analysis.summary;
  for(const [id,values] of [['strength-list',analysis.strengths],['risk-list',analysis.risks]])$(id).innerHTML=values.map(v=>`<li>${esc(v)}</li>`).join('');
  $('consequence-text').textContent=analysis.consequence;$('recommend-text').textContent=recommendationText(r);$('apply-recommendation').hidden=!r.recommendation;renderProviders();
}
function renderProviders() {
  const providers=state.providers[state.lang];
  if(!providers){$('provider-content').innerHTML=`<p class="micro">${esc(t('aiNotRequested'))}</p>`;return;}
  $('provider-content').innerHTML=['openai','nvidia'].map(key=>{
    const p=providers[key],ok=p?.status==='ok',errorKey=`provider_${p?.status}`;
    return `<section class="provider ${ok?'':'failed'}"><h4>${esc(t(key==='openai'?'openaiHeading':'nvidiaHeading'))} · ${esc(t(ok?'ready':'unavailable'))}</h4><p>${esc(ok?p.text:t(translations[state.lang][errorKey]?errorKey:'provider_error'))}</p>${ok?'':`<p class="micro">${esc(t('localAvailable'))}</p>`}</section>`;
  }).join('');
}
function renderTeams() {
  const teams=[...state.teams].sort((a,b)=>b.score-a.score);
  $('teams-list').innerHTML=teams.length?teams.map((team,i)=>`<article class="team-card panel"><div class="panel-top"><span class="team-rank">${esc(t('scenario'))} / ${String(i+1).padStart(2,'0')}</span><button data-delete="${esc(team.id)}" aria-label="${esc(t('remove')+' '+team.name)}">×</button></div><h3>${esc(team.name)}</h3><div class="team-score">${fmt(team.score)} <small>${esc(t('vsBase',{value:delta(team.gain)}))}</small></div><div class="team-facts">${esc(t('budget'))}: ${team.spent}/100 · ${esc(t('reserve'))}: ${100-team.spent}<br>${esc(t('criticalLabel'))}: ${team.critical}<br>${esc(team.choices.map(c=>c.action).join(' · '))}</div><button class="team-load" data-load="${esc(team.id)}">${esc(t('openEdit'))}</button></article>`).join(''):`<div class="empty-state">${esc(t('emptyScenarios'))}</div>`;
  $('teams-list').querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>{state.teams=state.teams.filter(x=>x.id!==b.dataset.delete);persist();renderTeams();});
  $('teams-list').querySelectorAll('[data-load]').forEach(b=>b.onclick=async()=>{const team=state.teams.find(x=>x.id===b.dataset.load);if(await setChoices(team.choices,t('scenarioLoaded')))$('workspace').scrollIntoView({behavior:'smooth'});});renderButtons();
}
function renderStatic() {
  $('target-district').innerHTML=state.data.districts.map(d=>`<option value="${d.id}">${esc(nameOf(d.id))}</option>`).join('');$('target-district').value=state.target;
  $('presets').innerHTML=state.data.presets.map((p,i)=>`<button class="preset" data-preset="${p.id}"><small>${esc(t('startingStrategy'))} / 0${i+1}</small><strong>${esc(t(`preset_${p.id}`))}</strong><p>${esc(t(`desc_${p.id}`))}</p></button>`).join('');
  $('presets').querySelectorAll('button').forEach(b=>b.onclick=()=>setChoices(state.data.presets.find(p=>p.id===b.dataset.preset).choices,t('strategyLoaded')));
  $('source-table').innerHTML=`<table><caption class="sr-only">${esc(t('sourceCaption'))}</caption><thead><tr><th scope="col">${esc(t('district'))}</th><th scope="col">${esc(t('population'))}</th>${state.data.indicators.map(i=>`<th scope="col" title="${esc(nameOf(i.id))}">${i.id}</th>`).join('')}<th scope="col">${esc(t('indexD'))}</th></tr></thead><tbody>${state.data.districts.map(d=>`<tr><th scope="row">${esc(nameOf(d.id))}</th><td>${Math.round(d.population_share*100)}%</td>${state.data.indicators.map(i=>`<td>${fmt(d.scores[i.id],0)}</td>`).join('')}<td>${fmt(state.data.baseline.districts.find(x=>x.id===d.id).before)}</td></tr>`).join('')}<tr><th scope="row">${esc(t('indicatorWeight'))}</th><td>—</td>${state.data.indicators.map(i=>`<td>${fmt(i.weight)}</td>`).join('')}<td>Σ = 1</td></tr></tbody></table>`;
}
function render(){renderNav();renderCatalog();renderDashboard();renderAtlas();renderResults();renderTeams();renderButtons();}
function exportPassport() {
  const r=state.result;if(!r.complete)return;
  const title=$('team-name').value.trim()||t('defaultName'),a=analysisFor(r),providers=state.providers[state.lang];
  const table=(headers,rows)=>`<div class="scroll"><table><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const html=`<!doctype html><html lang="${state.lang}"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)} — ${esc(t('reportTitle'))}</title><style>body{font:17px/1.65 system-ui,sans-serif;max-width:1100px;margin:40px auto;padding:0 24px;color:#20372b}h1{font-size:40px;line-height:1.15}h2{margin-top:32px}table{border-collapse:collapse;width:100%;font-size:14px}th,td{border-bottom:1px solid #ced5c8;padding:12px;text-align:left}th{background:#e5eddc}.lead{padding:24px;background:#e5eddc;font-size:23px}.note{color:#4c6251;font-size:14px}.scroll{overflow:auto}@media print{body{margin:0}h2,tr{break-inside:avoid}}</style><body><p>QALA.LAB / HACKALEM AI</p><h1>${esc(title)}</h1><p class="lead">${esc(a.summary)}</p><p>${esc(t('reportSubtitle'))}</p><h2>${esc(t('measurePlan'))}</h2>${table([t('measure'),t('territory'),t('cost'),t('delay'),t('realizedEffects')],r.contributions.map(c=>[`${c.action} · ${nameOf(c.action)}`,choiceLocation(c),c.cost,`${c.lag} ${t('quarterShort')}`,Object.entries(c.effects).map(([k,v])=>`${k} ${delta(v)}`).join(', ')]))}<p>${esc(t('synergies'))}: ${esc(r.synergies.length?r.synergies.map(s=>`${s.pair.join(' + ')} (${nameOf(s.district)}): ${Object.entries(s.effects).map(([k,v])=>`${k} +${v}`).join(', ')}`).join('; '):t('none'))}.</p><h2>${esc(t('districtComparison'))}</h2>${table([t('district'),t('before'),t('after'),t('change')],r.districts.map(d=>[nameOf(d.id),fmt(d.before),fmt(d.after),delta(d.delta)]))}<h2>${esc(t('allIndicators'))}</h2>${table([t('district'),...state.data.indicators.map(i=>i.id)],r.districts.map(d=>[nameOf(d.id),...state.data.indicators.map(i=>fmt(d.scores[i.id]))]))}<p class="note">${esc(state.data.indicators.map(i=>`${i.id} — ${nameOf(i.id)}`).join('; '))}.</p><h2>${esc(t('calculation'))}</h2><p>0.7 × ${fmt(r.formula.city_average,4)} + 0.3 × ${fmt(r.formula.weakest_district,4)} − ${r.formula.critical_count} = ${fmt(r.score)} (${esc(t('rounded'))}).</p><h2>${esc(t('strengthsRisks'))}</h2><ul>${[...a.strengths,...a.risks].map(s=>`<li>${esc(s)}</li>`).join('')}</ul><p>${esc(a.consequence)}</p>${providers?['openai','nvidia'].map(k=>providers[k]?.status==='ok'?`<h2>${esc(t(k==='openai'?'openaiHeading':'nvidiaHeading'))}</h2><p>${esc(providers[k].text)}</p>`:'').join(''):''}<p class="note">${esc(t('reportNote'))}</p></body></html>`;
  const url=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'})),link=document.createElement('a');link.href=url;link.download=`qala-scenario-${state.lang}.html`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast(t('reportDownloaded'));
}
function bindControls() {
  $('target-district').onchange=e=>{state.target=e.target.value;renderCatalog();};
  $('reset-button').onclick=()=>setChoices([],t('planReset'));
  $('example-button').onclick=async()=>{if(await setChoices(state.data.presets[0].choices))$('workspace').scrollIntoView({behavior:'smooth'});};
  document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{state.view=b.dataset.view;document.querySelectorAll('[data-view]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});renderAtlas();});
  $('analyze-button').onclick=async()=>{
    if(!state.result.complete||state.analyzing||state.changing||booting)return;
    const snapshot=JSON.stringify(state.choices),lang=state.lang;state.analyzing=true;renderButtons();$('result-section').scrollIntoView({behavior:'smooth'});
    try {
      const r=await api('/api/analyze',{choices:JSON.parse(snapshot),lang});
      if(snapshot!==JSON.stringify(state.choices)){toast(t('planChanged'));return;}
      state.providers[lang]=r.providers;renderProviders();toast(t('aiFinished'));
    }catch(e){toast(e.message,true);}finally{state.analyzing=false;renderButtons();}
  };
  $('apply-recommendation').onclick=()=>{if(state.result.recommendation)setChoices(state.result.recommendation.choices,t('replacementApplied'));};
  $('save-form').onsubmit=e=>{
    e.preventDefault();if(!state.result.complete||state.changing||booting)return;
    const name=$('team-name').value.trim();if(!name){toast(t('enterName'),true);return;}
    const r=state.result;state.teams.push({id:`${Date.now()}-${Math.random().toString(16).slice(2)}`,name:name.slice(0,40),score:r.score,gain:r.gain,spent:r.spent,critical:r.formula.critical_count,choices:structuredClone(state.choices)});state.teams=state.teams.slice(-30);persist();renderTeams();toast(t('scenarioSaved'));
  };
  $('export-button').onclick=exportPassport;$('mode-3d').onclick=initCity3D;$('mode-2d').onclick=()=>setMapMode('2d');
  $('city3d-minus').onclick=()=>city3d?.zoomBy(1/1.2);$('city3d-plus').onclick=()=>city3d?.zoomBy(1.2);$('city3d-reset').onclick=()=>city3d?.reset();
}
async function init() {
  if(booting)return;booting=true;$('load-status').hidden=false;$('load-status-text').textContent=t('loading');$('retry-button').hidden=true;renderButtons();
  try {
    translations=await api('/locales.json');translatePage();
    const data=await api('/api/bootstrap');
    if(data.version!=='hackalem-districts-v2')throw new Error(t('oldServer'));
    state.data=data;state.result=data.baseline;state.choices=[];state.providers={};renderStatic();render();bindControls();
    let stored;try{stored=JSON.parse(localStorage.getItem(storageKey)||'null');}catch{}
    if(stored?.version===data.version){
      if(Array.isArray(stored.teams))state.teams=(await Promise.all(stored.teams.slice(0,30).map(async(team,i)=>{
        if(!team||typeof team.name!=='string')return null;
        try{const r=await api('/api/simulate',{choices:team.choices});return r.complete?{id:`restored-${i}`,name:team.name.slice(0,40),score:r.score,gain:r.gain,spent:r.spent,critical:r.formula.critical_count,choices:r.choices}:null;}catch{return null;}
      }))).filter(Boolean);
      if(Array.isArray(stored.choices)&&stored.choices.length){try{const r=await api('/api/simulate',{choices:stored.choices});state.choices=r.choices;state.result=r;}catch{/* Keep a usable empty plan if the saved draft is invalid. */}}
    }
    render();$('load-status').hidden=true;void initCity3D();
  }catch(e){$('load-status').hidden=false;$('load-status-text').textContent=t('loadFailed',{reason:e.message});$('retry-button').hidden=false;$('completion-hint').textContent=t('notLoaded');}
  finally{booting=false;renderButtons();}
}
updatePreferenceButtons();
$('language-toggle').onclick=()=>{const languages=['ru','en','kk'];state.lang=languages[(languages.indexOf(state.lang)+1)%languages.length];savePreferences();updatePreferenceButtons();translatePage();if(state.data){renderStatic();render();}};
$('theme-toggle').onclick=()=>{state.theme=state.theme==='night'?'studio':'night';applyTheme();savePreferences();};
$('retry-button').onclick=init;applyTheme();init();
})();
