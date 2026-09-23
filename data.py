"""Teaching dataset transcribed from task/Датасет районов.docx.

No observed population counts, intervention effects or prices are invented here.
"""
BUDGET = 100
HORIZON = 8
DATASET_VERSION = 'hackalem-districts-v2'
CATEGORIES = [
    {'id': 'transport', 'name': 'Транспорт', 'icon': '↗', 'color': '#84b7ff'},
    {'id': 'green', 'name': 'Экология', 'icon': '✳', 'color': '#b9ec91'},
    {'id': 'social', 'name': 'Соцсфера', 'icon': '✚', 'color': '#ffbf86'},
    {'id': 'safety', 'name': 'Безопасность', 'icon': '◇', 'color': '#c9acf7'},
    {'id': 'service', 'name': 'Сервисы', 'icon': '◎', 'color': '#7dddd3'},
]
INDICATORS = [
    {'id': 'T1', 'category': 'transport', 'name': 'Разгрузка дорог', 'weight': .10},
    {'id': 'T2', 'category': 'transport', 'name': 'Доступность транспорта', 'weight': .10},
    {'id': 'E1', 'category': 'green', 'name': 'Озеленение', 'weight': .09},
    {'id': 'E2', 'category': 'green', 'name': 'Качество воздуха', 'weight': .11},
    {'id': 'S1', 'category': 'social', 'name': 'Школы и детсады', 'weight': .11},
    {'id': 'S2', 'category': 'social', 'name': 'Первичная медпомощь', 'weight': .11},
    {'id': 'B1', 'category': 'safety', 'name': 'Безопасность улиц', 'weight': .09},
    {'id': 'B2', 'category': 'safety', 'name': 'Безопасность движения', 'weight': .09},
    {'id': 'C1', 'category': 'service', 'name': 'Надёжность ЖКХ', 'weight': .10},
    {'id': 'C2', 'category': 'service', 'name': 'Решение обращений', 'weight': .10},
]
_DISTRICT_ROWS = [
    ('esil', 'Есиль', .27, [45,62,68,72,48,55,78,60,75,70], 'Богатый район, но пробки на мостах и переполненные школы.'),
    ('almaty', 'Алматы', .24, [40,75,50,55,60,65,62,52,50,60], 'Старые сети ЖКХ и пробки.'),
    ('saryarka', 'Сарыарка', .20, [50,70,42,40,62,68,58,55,45,55], 'Смог от частного сектора и слабое озеленение.'),
    ('baikonur', 'Байконур', .13, [52,68,55,50,58,60,52,58,55,58], 'Средние показатели без ярких перекосов.'),
    ('nura', 'Нура', .16, [55,40,45,65,38,35,55,50,60,50], 'Главный дефицит — социальная инфраструктура и транспорт.'),
]
DISTRICTS = [{'id': code, 'name': name, 'population_share': pop,
              'scores': dict(zip([i['id'] for i in INDICATORS], scores)), 'note': note}
             for code, name, pop, scores, note in _DISTRICT_ROWS]
_ACTION_ROWS = [
 ('M1','transport','Выделенные полосы для автобусов','district',18,2,{'T1':6,'T2':9}),
 ('M2','transport','Умные светофоры','city',22,2,{'T1':4,'B2':3}),
 ('M3','transport','Линия ЛРТ / расширение','district',30,4,{'T1':16,'T2':20,'E2':4}),
 ('M4','green','Парк / сквер','district',15,2,{'E1':12,'E2':3,'B1':2}),
 ('M5','green','Перевод частного сектора на чистое топливо','district',25,3,{'E2':14,'C1':4}),
 ('M6','green','Городское озеленение и ветрозащитные полосы','city',20,4,{'E1':5,'E2':3}),
 ('M7','social','Школа + детсад','district',24,3,{'S1':16}),
 ('M8','social','Центр семейного здоровья / поликлиника','district',20,3,{'S2':14}),
 ('M9','social','Дворовые спорт-хабы','district',10,1,{'S1':3,'S2':3,'B1':3}),
 ('M10','safety','Освещение и камеры Safe City','district',12,1,{'B1':12,'B2':2}),
 ('M11','safety','Безопасные переходы и школьные зоны','district',10,1,{'B2':12,'T1':-2}),
 ('M12','service','Единая цифровая платформа обращений','city',14,1,{'C2':5}),
 ('M13','service','Модернизация тепло- и водосетей','district',28,4,{'C1':18,'E2':2}),
 ('M14','service','Аварийные бригады ЖКХ + раннее оповещение','city',16,1,{'C1':5,'C2':2}),
]
ACTIONS = [{'id': code, 'category': category, 'name': name, 'scope': scope,
            'cost': cost, 'lag': lag, 'effects': effects}
           for code, category, name, scope, cost, lag, effects in _ACTION_ROWS]
SYNERGIES = [
    {'pair': ['M1','M2'], 'effects': {'T1': 2}},
    {'pair': ['M10','M12'], 'effects': {'B1': 2}},
    {'pair': ['M5','M6'], 'effects': {'E2': 2}},
]
CONFLICTS = [
    {'pair': ['M1','M3'], 'scope': 'any', 'reason': 'Выберите BRT или ЛРТ: M1 и M3 несовместимы в любых районах.'},
    {'pair': ['M4','M7'], 'scope': 'district', 'reason': 'M4 и M7 конфликтуют за участок в одном районе.'},
    {'pair': ['M5','M13'], 'scope': 'district', 'reason': 'M5 и M13 дублируют программу в одном районе.'},
]
PRESETS = [
    {'id': 'source', 'name': 'Социальный импульс', 'description': 'Пример из датасета: Нура, чистый воздух и цифровой сервис.',
     'choices': [{'action':'M7','district':'nura'},{'action':'M8','district':'nura'},{'action':'M10','district':'nura'},{'action':'M12'},{'action':'M5','district':'saryarka'}]},
    {'id': 'reserve', 'name': 'Больше резерва', 'description': 'Недорогой набор из датасета. Районы выбраны для этого примера.',
     'choices': [{'action':'M9','district':'nura'},{'action':'M11','district':'almaty'},{'action':'M10','district':'baikonur'},{'action':'M12'},{'action':'M4','district':'saryarka'}]},
    {'id': 'connections', 'name': 'Город связей', 'description': 'Авторский сценарий из мер датасета: автобусные полосы и умные светофоры.',
     'choices': [{'action':'M1','district':'nura'},{'action':'M2'},{'action':'M9','district':'nura'},{'action':'M4','district':'saryarka'},{'action':'M14'}]},
]
