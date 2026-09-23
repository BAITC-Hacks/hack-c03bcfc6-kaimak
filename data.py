"""Synthetic input data for the city management simulator.

All scores, populations, prices, and impacts are fictional teaching values.
"""

BUDGET = 1000  # million virtual tenge

CATEGORIES = [
    {"id": "transport", "name": "Транспорт", "short": "Мобильность", "weight": 0.23, "icon": "↗", "color": "#5596ed"},
    {"id": "green", "name": "Озеленение", "short": "Зелёный город", "weight": 0.18, "icon": "✳", "color": "#7dc982"},
    {"id": "social", "name": "Социальная инфраструктура", "short": "Доступность", "weight": 0.23, "icon": "✚", "color": "#e9aa68"},
    {"id": "safety", "name": "Безопасность", "short": "Защищённость", "weight": 0.19, "icon": "◇", "color": "#bf9be8"},
    {"id": "service", "name": "Городской сервис", "short": "Удобство", "weight": 0.17, "icon": "◎", "color": "#66c9c5"},
]

DISTRICTS = [
    {"id": "north", "name": "Северный", "population": 260000, "scores": {"transport": 48, "green": 42, "social": 54, "safety": 63, "service": 51}, "note": "Высокая нагрузка на маршруты и мало зелёных зон."},
    {"id": "center", "name": "Центральный", "population": 310000, "scores": {"transport": 71, "green": 58, "social": 67, "safety": 60, "service": 72}, "note": "Сильные сервисы, но плотность повышает нагрузку."},
    {"id": "south", "name": "Южный", "population": 240000, "scores": {"transport": 52, "green": 67, "social": 43, "safety": 49, "service": 47}, "note": "Хорошая среда, дефицит социальных объектов."},
    {"id": "east", "name": "Восточный", "population": 190000, "scores": {"transport": 39, "green": 36, "social": 50, "safety": 45, "service": 41}, "note": "Наибольший совокупный дефицит инфраструктуры."},
]

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
