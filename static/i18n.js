/* Russian source copy with English and Kazakh equivalents. */
const translations = [
['Аким на 5 часов · Astana City Lab','Mayor for 5 hours · Astana City Lab','5 сағатқа әкім · Astana City Lab'],
['Аким на 5 часов · Учебный симулятор HackAlem AI','Mayor for 5 hours · HackAlem AI learning simulator','5 сағатқа әкім · HackAlem AI оқу симуляторы'],
['Аким на ','Mayor for ','Әкім: '],['5 часов','5 hours','5 сағат'],
['Наверх','Back to top','Жоғары'],['Главное меню','Main navigation','Басты мәзір'],
['Симулятор','Simulator','Симулятор'],['Районы','Districts','Аудандар'],['Команды','Teams','Командалар'],
['ГОРОДСКАЯ ЛАБОРАТОРИЯ РЕШЕНИЙ','CITY DECISION LAB','ҚАЛАЛЫҚ ШЕШІМДЕР ЗЕРТХАНАСЫ'],
['Пять решений. Один бюджет. Посмотрите, как ваш сценарий меняет качество жизни условного города.','Five decisions. One budget. Explore how your scenario changes quality of life in a simulated city.','Бес шешім. Бір бюджет. Сценарийіңіз шартты қаладағы өмір сапасын қалай өзгертетінін көріңіз.'],
['Начать симуляцию','Start simulation','Симуляцияны бастау'],['Загрузить пример','Load example','Мысалды жүктеу'],
['Синтетические данные · Все команды начинают с одинаковых условий','Synthetic data · All teams start with the same conditions','Шартты деректер · Барлық командалар бірдей жағдайдан бастайды'],
['РЕШЕНИЙ ДЛЯ ГОРОДА','DECISIONS FOR THE CITY','ҚАЛАҒА АРНАЛҒАН ШЕШІМ'],
['Условия симуляции','Simulation conditions','Симуляция шарттары'],['ВИРТУАЛЬНЫЙ БЮДЖЕТ','VIRTUAL BUDGET','ВИРТУАЛДЫ БЮДЖЕТ'],
['РАЙОНОВ ИЗ PDF','DISTRICTS FROM PDF','PDF-ТЕГІ АУДАНДАР'],['5 районов','5 districts','5 аудан'],
['НАПРАВЛЕНИЙ','POLICY AREAS','БАҒЫТ'],['5 решений','5 decisions','5 шешім'],['ЦЕЛЬ','GOAL','МАҚСАТ'],['Выше качество жизни','Better quality of life','Өмір сапасын арттыру'],
['01 / ВАША СТРАТЕГИЯ','01 / YOUR STRATEGY','01 / СІЗДІҢ СТРАТЕГИЯҢЫЗ'],['Соберите свой сценарий','Build your scenario','Сценарийіңізді құрыңыз'],
['Выберите по одному мероприятию в каждом направлении и укажите район.','Choose one action in each policy area and select its district.','Әр бағыттан бір шараны және оның ауданын таңдаңыз.'],
['Сбросить','Reset','Қалпына келтіру'],['РЕШЕНИЙ','DECISIONS','ШЕШІМ'],['НАПРАВЛЕНИЯ','POLICY AREAS','БАҒЫТТАР'],
['Любое решение можно изменить до финального анализа.','You can change any decision before the final analysis.','Қорытынды талдауға дейін кез келген шешімді өзгерте аласыз.'],
['Выбор мероприятий','Action selection','Шараларды таңдау'],['БЮДЖЕТ СЦЕНАРИЯ','SCENARIO BUDGET','СЦЕНАРИЙ БЮДЖЕТІ'],
['млн ₸','million ₸','млн ₸'],['осталось','remaining','қалды'],['Использовано','Spent','Жұмсалды'],
['Ожидаем данные…','Loading data…','Деректер жүктелуде…'],['Получить AI-разбор','Get AI analysis','AI талдауын алу'],
['Выберите все пять решений','Select all five decisions','Бес шешімнің бәрін таңдаңыз'],
['02 / ИТОГ СЦЕНАРИЯ','02 / SCENARIO RESULTS','02 / СЦЕНАРИЙ НӘТИЖЕСІ'],['Что изменится в городе','What changes in the city','Қалада не өзгереді'],
['Расчёт основан на выбранных мероприятиях и синтетических показателях.','Calculations use the selected actions and synthetic indicators.','Есеп таңдалған шаралар мен шартты көрсеткіштерге негізделген.'],
['АНАЛИЗ ГОТОВ','ANALYSIS READY','ТАЛДАУ ДАЙЫН'],['АНАЛИТИЧЕСКИЙ ВЫВОД','ANALYTICAL SUMMARY','ТАЛДАУ ҚОРЫТЫНДЫСЫ'],
['OPENAI · СИНТЕЗ СЦЕНАРИЯ','OPENAI · SCENARIO SUMMARY','OPENAI · СЦЕНАРИЙ ҚОРЫТЫНДЫСЫ'],['NVIDIA NIM · ГИПОТЕЗА О РИСКАХ','NVIDIA NIM · RISK REVIEW','NVIDIA NIM · ТӘУЕКЕЛДЕРДІ БАҒАЛАУ'],
['Сильные стороны','Strengths','Артықшылықтар'],['Риски и последствия','Risks and consequences','Тәуекелдер мен салдарлар'],['ГЛАВНЫЙ КОМПРОМИСС','MAIN TRADE-OFF','НЕГІЗГІ ЫМЫРА'],
['АГЕНТ РЕКОМЕНДАЦИЙ','RECOMMENDATION AGENT','ҰСЫНЫС АГЕНТІ'],['Можно улучшить?','Can we improve?','Жақсартуға бола ма?'],['Применить рекомендацию','Apply recommendation','Ұсынысты қолдану'],
['СРАВНИТЬ С КОМАНДАМИ','COMPARE TEAMS','КОМАНДАЛАРДЫ САЛЫСТЫРУ'],['Сохраните сценарий','Save your scenario','Сценарийді сақтаңыз'],
['Результаты хранятся в этом браузере.','Results are stored in this browser.','Нәтижелер осы браузерде сақталады.'],['Название команды','Team name','Команда атауы'],['Сохранить результат','Save result','Нәтижені сақтау'],
['03 / КАРТА ДАННЫХ','03 / DATA MAP','03 / ДЕРЕКТЕР КАРТАСЫ'],['Районы города','City districts','Қала аудандары'],
['Показатели из «Датасет районов.pdf». Выберите район, чтобы увидеть его профиль.','Indicators from “Датасет районов.pdf”. Select a district to view its profile.','«Датасет районов.pdf» көрсеткіштері. Профилін көру үшін ауданды таңдаңыз.'],
['ДАННЫЕ ИЗ PDF','PDF DATASET','PDF ДЕРЕКТЕРІ'],['ИНТЕРАКТИВНАЯ СХЕМА','INTERACTIVE DIAGRAM','ИНТЕРАКТИВТІ СЫЗБА'],
['Схематичная карта, не соответствует реальной географии Астаны.','Schematic map; does not represent Astana’s actual geography.','Сызба Астананың нақты географиясын көрсетпейді.'],
['04 / СРАВНЕНИЕ','04 / COMPARISON','04 / САЛЫСТЫРУ'],['Сценарии команд','Team scenarios','Команда сценарийлері'],
['Сохранённые результаты доступны только в этом браузере.','Saved results are available only in this browser.','Сақталған нәтижелер тек осы браузерде қолжетімді.'],['СЦЕНАРИЕВ','SCENARIOS','СЦЕНАРИЙ'],
['РЕШЕНИЕ','DECISION','ШЕШІМ'],['ВЫБРАНО','SELECTED','ТАҢДАЛДЫ'],['ОЖИДАЕТ ВЫБОРА','AWAITING SELECTION','ТАҢДАУ КҮТІЛУДЕ'],
['Выберите одно мероприятие. Стоимость списывается из общего бюджета команды.','Choose one action. Its cost is deducted from the shared team budget.','Бір шараны таңдаңыз. Құны команданың ортақ бюджетінен алынады.'],
['Прямой эффект в выбранном районе, часть эффекта — в остальных.','Direct impact in the selected district, with smaller effects elsewhere.','Негізгі әсер таңдалған ауданда, қалған аудандарда әсері аздау.'],
['К результату','View results','Нәтижеге өту'],['Следующее направление','Next policy area','Келесі бағыт'],
['к исходному','from baseline','бастапқы мәннен'],['Исходное состояние города','Initial city conditions','Қаланың бастапқы жағдайы'],['База:','Baseline:','Бастапқы мән:'],
['Анализируем сценарий…','Analyzing scenario…','Сценарий талдануда…'],['Все пять направлений заполнены','All five policy areas are complete','Бес бағыттың бәрі толтырылды'],['Осталось решений:','Decisions remaining:','Қалған шешімдер:'],
['ДОЛЯ НАСЕЛЕНИЯ','POPULATION SHARE','ХАЛЫҚ ҮЛЕСІ'],
['Локальный аналитический агент','Local analysis agent','Жергілікті талдау агенті'],['Локальный агент +','Local agent +','Жергілікті агент +'],
['Пока нет сохранённых результатов.','No saved results yet.','Әзірге сақталған нәтижелер жоқ.'],['Соберите первый сценарий команды.','Build your team’s first scenario.','Команданың алғашқы сценарийін құрыңыз.'],
['КОМАНДА','TEAM','КОМАНДА'],['Удалить','Delete','Жою'],['к базе','from baseline','бастапқы мәннен'],['Открыть сценарий','Open scenario','Сценарийді ашу'],
['Пример сценария загружен. Все решения можно изменить.','Example loaded. You can change every decision.','Мысал жүктелді. Барлық шешімдерді өзгертуге болады.'],
['Для анализа нужны все пять решений.','All five decisions are required for analysis.','Талдау үшін бес шешімнің бәрі қажет.'],
['Сценарий сброшен к исходным условиям.','Scenario reset to initial conditions.','Сценарий бастапқы жағдайға қайтарылды.'],
['Рекомендация применена. Запустите анализ ещё раз.','Recommendation applied. Run the analysis again.','Ұсыныс қолданылды. Талдауды қайта іске қосыңыз.'],
['Введите название команды.','Enter a team name.','Команда атауын енгізіңіз.'],['Сценарий команды сохранён.','Team scenario saved.','Команда сценарийі сақталды.'],
['Ошибка сервера','Server error','Сервер қатесі'],['Не удалось загрузить симулятор:','Unable to load simulator:','Симуляторды жүктеу мүмкін болмады:'],
['Не удалось загрузить данные. Обновите страницу или перезапустите сервер.','Unable to load data. Refresh the page or restart the server.','Деректер жүктелмеді. Бетті жаңартыңыз немесе серверді қайта іске қосыңыз.'],
['Бюджет превышен на','Budget exceeded by','Бюджеттен асып кеткен сома:'],['Измените другое решение.','Change another decision.','Басқа шешімді өзгертіңіз.'],
['Транспорт','Transport','Көлік'],['Озеленение','Greening','Көгалдандыру'],['Социальная инфраструктура','Social infrastructure','Әлеуметтік инфрақұрылым'],['Безопасность','Safety','Қауіпсіздік'],['Городской сервис','City services','Қалалық қызметтер'],
['Мобильность','Mobility','Ұтқырлық'],['Зелёный город','Green city','Жасыл қала'],['Доступность','Accessibility','Қолжетімділік'],['Защищённость','Protection','Қорғалу'],['Удобство','Convenience','Қолайлылық'],
['Приоритет для автобусов','Bus priority','Автобустарға басымдық'],['Выделенные полосы и приоритет на перекрёстках.','Dedicated lanes and priority at intersections.','Арнайы жолақтар және қиылыстардағы басымдық.'],
['Новая маршрутная сеть','New route network','Жаңа маршруттар желісі'],['Пересадочные узлы и более частые рейсы.','Transfer hubs and more frequent services.','Ауысып отыру тораптары және жиі рейстер.'],
['Умные светофоры','Smart traffic lights','Ақылды бағдаршамдар'],['Адаптивное управление потоком движения.','Adaptive traffic flow management.','Көлік ағынын бейімдеп басқару.'],
['Районный парк','District park','Аудандық саябақ'],['Новый общественный парк с прогулочными маршрутами.','A new public park with walking routes.','Серуен жолдары бар жаңа қоғамдық саябақ.'],
['Тенистые улицы','Shaded streets','Көлеңкелі көшелер'],['Деревья и комфортные пешеходные связи.','Trees and comfortable pedestrian connections.','Ағаштар және жайлы жаяу жүргінші жолдары.'],
['Зелёные дворы','Green courtyards','Жасыл аулалар'],['Озеленение и обновление дворовых пространств.','Greening and upgrading courtyards.','Аулаларды көгалдандыру және жаңарту.'],
['Районная поликлиника','District clinic','Аудандық емхана'],['Дополнительная медицинская доступность.','Improved access to healthcare.','Медициналық көмектің қолжетімділігін арттыру.'],
['Новые учебные места','Additional school places','Жаңа оқу орындары'],['Расширение школ и внешкольных площадок.','Expansion of schools and after-school spaces.','Мектептер мен қосымша білім беру орындарын кеңейту.'],
['Центры соседства','Community centers','Қоғамдық орталықтар'],['Многофункциональные пространства у дома.','Multipurpose spaces close to home.','Үй маңындағы көпфункциялы кеңістіктер.'],
['Безопасные улицы','Safe streets','Қауіпсіз көшелер'],['Освещение и безопасные переходы.','Lighting and safe crossings.','Жарықтандыру және қауіпсіз өткелдер.'],
['Быстрое реагирование','Rapid response','Жедел әрекет ету'],['Координация городских служб и диспетчеризация.','Coordination and dispatch of city services.','Қалалық қызметтерді үйлестіру және диспетчерлеу.'],
['Безопасный путь в школу','Safe routes to school','Мектепке қауіпсіз жол'],['Переходы, навигация и успокоение трафика.','Crossings, wayfinding and traffic calming.','Өткелдер, бағыттау белгілері және қозғалысты баяулату.'],
['Единое окно услуг','One-stop services','Бірыңғай қызмет көрсету терезесі'],['Понятная точка доступа к городским услугам.','A clear access point for city services.','Қалалық қызметтерге қол жеткізудің түсінікті нүктесі.'],
['Умное содержание','Smart maintenance','Ақылды күтіп ұстау'],['Приоритизация ремонта по обращениям и состоянию.','Repair priorities based on reports and condition.','Өтініштер мен жағдайға қарай жөндеуге басымдық беру.'],
['Платформа обратной связи','Feedback platform','Кері байланыс платформасы'],['Обращения жителей с прозрачным статусом.','Resident requests with transparent status tracking.','Тұрғындар өтініштерінің мәртебесін ашық бақылау.'],
['Быстрый эффект','Quick impact','Жылдам әсер'],['Системный','Systemic','Жүйелі'],['Экономный','Affordable','Үнемді'],['Долгосрочный','Long-term','Ұзақ мерзімді'],['Локальный','Local','Жергілікті'],['Высокий эффект','High impact','Жоғары әсер'],['Гибкий','Flexible','Икемді'],['Цифровой','Digital','Цифрлық'],
['Данные районов — из PDF. Бюджет, мероприятия и формула результата — учебная модель этого симулятора.','District data comes from the PDF. The budget, actions and scoring formula use this simulator’s learning model.','Аудан деректері PDF-тен алынған. Бюджет, шаралар және есептеу формуласы осы симулятордың оқу моделіне негізделген.'],
];
translations.push(
['Аким на 5 часов — симулятор решений для города с общим бюджетом и прозрачным Astana Quality of Life Score.', 'Mayor for 5 hours — a city decision simulator with a shared budget and transparent quality of life score.', '5 сағатқа әкім — ортақ бюджеті және ашық өмір сапасы индексі бар қалалық шешімдер симуляторы.'],
['Решения должны быть объектом по пяти направлениям.','Decisions must cover the five policy areas.','Шешімдер бес бағыт бойынша берілуі керек.'],
['Неизвестное направление решения.','Unknown policy area.','Белгісіз бағыт.'],
['Неверный формат решения.','Invalid decision format.','Шешім пішімі қате.'],
['Укажите мероприятие и район для каждого решения.','Specify an action and district for every decision.','Әр шешім үшін шара мен ауданды көрсетіңіз.'],
['Мероприятие или район не найдены.','Action or district not found.','Шара немесе аудан табылмады.'],
['Примите по одному решению в каждом из пяти направлений.','Choose one decision in each of the five policy areas.','Бес бағыттың әрқайсысында бір шешім қабылдаңыз.'],
['Неверный размер запроса.','Invalid request size.','Сұрау өлшемі қате.'],
['Ожидаются только решения сценария.','Expected scenario decisions.','Сценарий шешімдері қажет.']
);
const indicatorNames = {
  T1: ['Разгрузка дорог','Road congestion relief','Жол жүктемесін азайту'],
  T2: ['Доступность общественного транспорта','Public transport access','Қоғамдық көліктің қолжетімділігі'],
  E1: ['Озеленение','Green space','Көгалдандыру'],
  E2: ['Качество воздуха','Air quality','Ауа сапасы'],
  S1: ['Школы и детсады','Schools and kindergartens','Мектептер мен балабақшалар'],
  S2: ['Первичная медпомощь','Primary healthcare','Алғашқы медициналық көмек'],
  B1: ['Безопасность улиц','Street safety','Көше қауіпсіздігі'],
  B2: ['Безопасность дорожного движения','Road safety','Жол қозғалысы қауіпсіздігі'],
  C1: ['Надёжность ЖКХ','Utility reliability','Коммуналдық қызметтердің сенімділігі'],
  C2: ['Скорость решения обращений','Request resolution speed','Өтініштерді шешу жылдамдығы'],
};
function indicatorLabel(code) { return indicatorNames[code][{ru:0,en:1,kk:2}[state.language]]; }
const orderedTranslations = [...translations].sort((a, b) => b[0].length - a[0].length);
function t(text) {
  if (state.language === 'ru') return text;
  const index = state.language === 'en' ? 1 : 2;
  const exact = translations.find(row => row[0] === text.trim());
  if (exact) return text.replace(text.trim(), exact[index]);
  // Replace source fragments once, without translating replacement text again.
  const escaped = orderedTranslations.map(row => row[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return text.replace(new RegExp(escaped.join('|'), 'g'), match => orderedTranslations.find(row => row[0] === match)[index]);
}
const sourceText = new WeakMap();
function translatePage() {
  document.documentElement.lang = state.language;
  const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (node.parentElement.closest('script, style, .team-card h3, #llm-narrative, #nvidia-review, [data-localized]')) continue;
    const previous = sourceText.get(node);
    const source = previous && previous.output === node.nodeValue ? previous.source : node.nodeValue;
    const output = t(source);
    if (node.nodeValue !== output) node.nodeValue = output;
    sourceText.set(node, {source, output});
  }
  document.querySelectorAll('[aria-label], [placeholder], meta[name="description"]').forEach(element => {
    for (const attr of ['aria-label', 'placeholder', 'content']) {
      if (!element.hasAttribute(attr)) continue;
      const key = `source-${attr}`;
      if (!element.hasAttribute(`data-${key}`)) element.setAttribute(`data-${key}`, element.getAttribute(attr));
      element.setAttribute(attr, t(element.getAttribute(`data-${key}`)));
    }
  });
  const button = document.querySelector('#language-button');
  button.textContent = {ru:'RU · English', en:'EN · Қазақша', kk:'ҚАЗ · Русский'}[state.language];
  button.setAttribute('aria-label', {ru:'Сменить язык на английский', en:'Switch language to Kazakh', kk:'Тілді орыс тіліне ауыстыру'}[state.language]);
}

function localizeAnalysis(result) {
  if (state.language === 'ru') return;
  const en = state.language === 'en';
  const f = format;
  const weakest = [...result.districts].sort((a,b) => a.after - b.after)[0];
  const district = localized(districtById(weakest.id));
  const strongest = Object.entries(result.city).sort((a,b) => b[1].delta - a[1].delta)[0];
  const lowest = Object.entries(result.city).sort((a,b) => a[1].after - b[1].after)[0];
  const leading = [...result.contributions].sort((a,b) => b.score_gain - a.score_gain)[0];
  $('#result-summary').textContent = en
    ? `Five decisions change the quality of life score from ${f(result.baseline_score)} to ${f(result.score)} (+${f(result.gain)}). Spending: ${f(result.spent)} of ${f(result.budget)} million ₸.`
    : `Бес шешім өмір сапасы индексін ${f(result.baseline_score)} мәнінен ${f(result.score)} мәніне өзгертеді (+${f(result.gain)}). ${f(result.budget)} млн ₸ бюджеттің ${f(result.spent)} млн ₸ сомасы жұмсалды.`;
  listInto('#strength-list', en ? [
    `Largest citywide improvement: ${t(categoryById(strongest[0]).name)} (+${f(strongest[1].delta)}).`,
    `Largest contribution to the score: ${t(actionById(leading.action).name)} in ${localized(districtById(leading.district))} (+${f(leading.score_gain)}).`,
  ] : [
    `Қала бойынша ең жоғары өсім: ${t(categoryById(strongest[0]).name)} (+${f(strongest[1].delta)}).`,
    `Жалпы балға ең үлкен үлес: ${localized(districtById(leading.district))} ауданындағы «${t(actionById(leading.action).name)}» (+${f(leading.score_gain)}).`,
  ]);
  listInto('#risk-list', en ? [
    `${district} remains the weakest district at ${f(weakest.after)}/100, limiting the overall score.`,
    `Lowest citywide indicator: ${t(categoryById(lowest[0]).name)} (${f(lowest[1].after)}/100).`,
    `Budget reserve: ${f(result.remaining)} million ₸. ${result.remaining < 100 ? 'Little funding remains for unexpected needs.' : 'Some potential impact remains unrealized.'}`,
  ] : [
    `${district} ең төмен көрсеткішке ие: ${f(weakest.after)}/100. Бұл жалпы балды шектейді.`,
    `Қаладағы ең төмен бағыт: ${t(categoryById(lowest[0]).name)} (${f(lowest[1].after)}/100).`,
    `Бюджет резерві: ${f(result.remaining)} млн ₸. ${result.remaining < 100 ? 'Күтпеген қажеттіліктерге аз қаражат қалды.' : 'Ықтимал әсердің бір бөлігі іске асырылмады.'}`,
  ]);
  $('#consequence-text').textContent = en
    ? `Investment improves selected districts, but ${district} still sets the lower bound for quality of life. Effects in neighboring districts are smaller than direct effects.`
    : `Инвестициялар таңдалған аудандарды жақсартады, бірақ ${district} өмір сапасының төменгі шегін анықтайды. Көрші аудандарға әсері тікелей әсерден аз.`;
  const rec = result.recommendation;
  $('#recommend-text').textContent = rec ? (en
    ? `Choose “${t(actionById(rec.action).name)}” in ${localized(districtById(rec.district))}. Expected score: ${f(rec.score)} (+${f(rec.improvement)}), with ${f(rec.remaining)} million ₸ remaining.`
    : `${localized(districtById(rec.district))} ауданында «${t(actionById(rec.action).name)}» шарасын таңдаңыз. Күтілетін балл: ${f(rec.score)} (+${f(rec.improvement)}), қалдық: ${f(rec.remaining)} млн ₸.`)
    : (en ? 'No single decision replacement improves the score. Try changing several decisions.' : 'Бір шешімді ауыстыру балды жақсартпайды. Бірнеше шешімді өзгертіп көріңіз.');
  const failures = Object.entries(result.providers || {}).filter(([, p]) => !['ok','unconfigured'].includes(p.status));
  $('#provider-status').textContent = failures.length ? (en
    ? `Provider analysis unavailable (${failures.map(([name,p]) => `${name}: ${p.status}`).join(', ')}). Local analysis is available.`
    : `Провайдер талдауы қолжетімсіз (${failures.map(([name,p]) => `${name}: ${p.status}`).join(', ')}). Жергілікті талдау қолжетімді.`) : '';
  // These values already use the selected language and must not be retranslated.
  for (const id of ['result-summary','strength-list','risk-list','consequence-text','recommend-text','provider-status']) {
    document.getElementById(id).setAttribute('data-localized','');
  }
}
