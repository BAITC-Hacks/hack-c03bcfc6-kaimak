"""Synthetic input data for the city management simulator.

All scores, populations, prices, and impacts are fictional teaching values.
"""

BUDGET = 1000  # million virtual tenge

CATEGORIES = [
    {"id": "transport", "name": "Транспорт", "short": "Мобильность", "weight": 0.20, "icon": "↗", "color": "#5596ed"},
    {"id": "green", "name": "Озеленение", "short": "Зелёный город", "weight": 0.20, "icon": "✳", "color": "#7dc982"},
    {"id": "social", "name": "Социальная инфраструктура", "short": "Доступность", "weight": 0.22, "icon": "✚", "color": "#e9aa68"},
    {"id": "safety", "name": "Безопасность", "short": "Защищённость", "weight": 0.18, "icon": "◇", "color": "#bf9be8"},
    {"id": "service", "name": "Городской сервис", "short": "Удобство", "weight": 0.20, "icon": "◎", "color": "#66c9c5"},
]

# District shares and ten directional indicators transcribed from «Датасет районов.pdf».
# Category scores are weighted means of the corresponding PDF indicators.
# Population values are normalized weights, not actual census counts.
PDF_INDICATORS = ["T1", "T2", "E1", "E2", "S1", "S2", "B1", "B2", "C1", "C2"]
PDF_WEIGHTS = {"T1": .10, "T2": .10, "E1": .09, "E2": .11, "S1": .11, "S2": .11, "B1": .09, "B2": .09, "C1": .10, "C2": .10}
DISTRICTS = [
    {"id":"yesil", "name":"Есиль", "name_en":"Yesil", "name_kk":"Есіл", "population":270000, "indicators":{"T1":45,"T2":62,"E1":68,"E2":72,"S1":48,"S2":55,"B1":78,"B2":60,"C1":75,"C2":70}, "note":"Богатый район, но есть пробки на мостах и переполненные школы.", "note_en":"Affluent district, with bridge congestion and overcrowded schools.", "note_kk":"Әл-ауқаты жоғары аудан, бірақ көпірлерде кептеліс пен мектептерде орын тапшылығы бар."},
    {"id":"almaty", "name":"Алматы", "name_en":"Almaty", "name_kk":"Алматы", "population":240000, "indicators":{"T1":40,"T2":75,"E1":50,"E2":55,"S1":60,"S2":65,"B1":62,"B2":52,"C1":50,"C2":60}, "note":"Старые сети ЖКХ и пробки.", "note_en":"Aging utilities and traffic congestion.", "note_kk":"Тозған коммуналдық желілер мен көлік кептелісі."},
    {"id":"saryarka", "name":"Сарыарка", "name_en":"Saryarka", "name_kk":"Сарыарқа", "population":200000, "indicators":{"T1":50,"T2":70,"E1":42,"E2":40,"S1":62,"S2":68,"B1":58,"B2":55,"C1":45,"C2":55}, "note":"Частный сектор ухудшает воздух; зелёных зон мало.", "note_en":"Air pollution from private housing and limited green space.", "note_kk":"Жеке сектор ауаны ластайды, жасыл аймақтар аз."},
    {"id":"baykonyr", "name":"Байконур", "name_en":"Baikonur", "name_kk":"Байқоңыр", "population":130000, "indicators":{"T1":52,"T2":68,"E1":55,"E2":50,"S1":58,"S2":60,"B1":52,"B2":58,"C1":55,"C2":58}, "note":"Средние показатели без выраженных перекосов.", "note_en":"Middle of the pack, without pronounced extremes.", "note_kk":"Айқын ауытқулары жоқ орташа көрсеткіштер."},
    {"id":"nura", "name":"Нура", "name_en":"Nura", "name_kk":"Нұра", "population":160000, "indicators":{"T1":55,"T2":40,"E1":45,"E2":65,"S1":38,"S2":35,"B1":55,"B2":50,"C1":60,"C2":50}, "note":"Главный дефицит — социальная инфраструктура и транспорт.", "note_en":"The largest gaps are in social infrastructure and transport.", "note_kk":"Негізгі тапшылық әлеуметтік инфрақұрылым мен көлікте."},
]
for _district in DISTRICTS:
    _district["population_share"] = _district["population"] / 1_000_000
    _i = _district["indicators"]
    _district["scores"] = {"transport":(_i["T1"]+_i["T2"])/2, "green":(_i["E1"]*.09+_i["E2"]*.11)/.20, "social":(_i["S1"]*.11+_i["S2"]*.11)/.22, "safety":(_i["B1"]*.09+_i["B2"]*.09)/.18, "service":(_i["C1"]*.10+_i["C2"]*.10)/.20}

# Impact is the direct lift in the chosen district before its need multiplier.
# Other districts receive 18% of the direct lift through citywide spillover.
# Cross effects are explicit, modest changes to connected indicators.
ACTIONS = [
    {"id": "bus", "category": "transport", "name": "Приоритет для автобусов", "cost": 180, "impact": 19, "cross": {"service": 3, "green": 1}, "description": "Выделенные полосы и приоритет на перекрёстках.", "tag": "Быстрый эффект"},
    {"id": "routes", "category": "transport", "name": "Новая маршрутная сеть", "cost": 260, "impact": 26, "cross": {"service": 4}, "description": "Пересадочные узлы и более частые рейсы.", "tag": "Системный"},
    {"id": "signals", "category": "transport", "name": "Умные светофоры", "cost": 120, "impact": 13, "cross": {"safety": 2}, "description": "Адаптивное управление потоком движения.", "tag": "Экономный"},
    {"id": "park", "category": "green", "name": "Районный парк", "cost": 220, "impact": 25, "cross": {"safety": 2, "service": 1}, "description": "Новый общественный парк с прогулочными маршрутами.", "tag": "Долгосрочный"},
    {"id": "trees", "category": "green", "name": "Тенистые улицы", "cost": 130, "impact": 16, "cross": {"transport": 1}, "description": "Деревья и комфортные пешеходные связи.", "tag": "Экономный"},
    {"id": "courtyards", "category": "green", "name": "Зелёные дворы", "cost": 170, "impact": 19, "cross": {"social": 2}, "description": "Озеленение и обновление дворовых пространств.", "tag": "Локальный"},
    {"id": "clinic", "category": "social", "name": "Районная поликлиника", "cost": 290, "impact": 27, "cross": {"service": 3}, "description": "Дополнительная медицинская доступность.", "tag": "Высокий эффект"},
    {"id": "school", "category": "social", "name": "Новые учебные места", "cost": 240, "impact": 23, "cross": {"safety": 1}, "description": "Расширение школ и внешкольных площадок.", "tag": "Системный"},
    {"id": "hubs", "category": "social", "name": "Центры соседства", "cost": 150, "impact": 16, "cross": {"service": 2, "safety": 1}, "description": "Многофункциональные пространства у дома.", "tag": "Гибкий"},
    {"id": "lighting", "category": "safety", "name": "Безопасные улицы", "cost": 150, "impact": 18, "cross": {"transport": 2}, "description": "Освещение и безопасные переходы.", "tag": "Быстрый эффект"},
    {"id": "response", "category": "safety", "name": "Быстрое реагирование", "cost": 230, "impact": 24, "cross": {"service": 3}, "description": "Координация городских служб и диспетчеризация.", "tag": "Системный"},
    {"id": "schoolroutes", "category": "safety", "name": "Безопасный путь в школу", "cost": 120, "impact": 14, "cross": {"social": 2}, "description": "Переходы, навигация и успокоение трафика.", "tag": "Экономный"},
    {"id": "onewindow", "category": "service", "name": "Единое окно услуг", "cost": 140, "impact": 17, "cross": {"social": 2}, "description": "Понятная точка доступа к городским услугам.", "tag": "Цифровой"},
    {"id": "maintenance", "category": "service", "name": "Умное содержание", "cost": 190, "impact": 22, "cross": {"safety": 2, "green": 1}, "description": "Приоритизация ремонта по обращениям и состоянию.", "tag": "Системный"},
    {"id": "feedback", "category": "service", "name": "Платформа обратной связи", "cost": 90, "impact": 12, "cross": {"safety": 1}, "description": "Обращения жителей с прозрачным статусом.", "tag": "Экономный"},
]
