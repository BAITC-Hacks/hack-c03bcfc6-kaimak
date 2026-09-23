"""Deterministic, auditable scoring and local scenario-search agent."""

from copy import deepcopy

from data import ACTIONS, BUDGET, CATEGORIES, DISTRICTS

CATEGORY_IDS = [category["id"] for category in CATEGORIES]
ACTION_BY_ID = {action["id"]: action for action in ACTIONS}
DISTRICT_BY_ID = {district["id"]: district for district in DISTRICTS}
WEIGHTS = {category["id"]: category["weight"] for category in CATEGORIES}
TOTAL_POPULATION = sum(district["population"] for district in DISTRICTS)


def _round(value):
    return round(value, 1)


def validate_choices(raw, complete=False):
    if not isinstance(raw, dict):
        raise ValueError("Решения должны быть объектом по пяти направлениям.")
    if set(raw) - set(CATEGORY_IDS):
        raise ValueError("Неизвестное направление решения.")
    choices = {}
    for category_id, choice in raw.items():
        if not isinstance(choice, dict):
            raise ValueError("Неверный формат решения.")
        if set(choice) != {"action", "district"}:
            raise ValueError("Укажите мероприятие и район для каждого решения.")
        action = ACTION_BY_ID.get(choice["action"])
        district = DISTRICT_BY_ID.get(choice["district"])
        if not action or action["category"] != category_id or not district:
            raise ValueError("Мероприятие или район не найдены.")
        choices[category_id] = {"action": action["id"], "district": district["id"]}
    if complete and len(choices) != len(CATEGORY_IDS):
        raise ValueError("Примите по одному решению в каждом из пяти направлений.")
    spent = sum(ACTION_BY_ID[choice["action"]]["cost"] for choice in choices.values())
    if spent > BUDGET:
        raise ValueError(f"Бюджет превышен на {spent - BUDGET} млн ₸.")
    return choices


def _aggregate(scores):
    city = {}
    for category_id in CATEGORY_IDS:
        city[category_id] = sum(
            scores[district["id"]][category_id] * district["population"]
            for district in DISTRICTS
        ) / TOTAL_POPULATION
    district_averages = {
        district["id"]: sum(scores[district["id"]][key] * WEIGHTS[key] for key in CATEGORY_IDS)
        for district in DISTRICTS
    }
    # The lowest district gets a visible 20% equity weight.
    score = 0.8 * sum(city[key] * WEIGHTS[key] for key in CATEGORY_IDS) + 0.2 * min(district_averages.values())
    return city, district_averages, score


def simulate(raw_choices, with_recommendation=False):
    choices = validate_choices(raw_choices)
    scores = {district["id"]: deepcopy(district["scores"]) for district in DISTRICTS}
    baseline_scores = {district["id"]: deepcopy(district["scores"]) for district in DISTRICTS}
    base_city, base_district, base_score = _aggregate(baseline_scores)
    contributions = []

    # Every intervention has local impact plus a smaller citywide spillover.
    for category_id in CATEGORY_IDS:
        if category_id not in choices:
            continue
        choice = choices[category_id]
        action = ACTION_BY_ID[choice["action"]]
        before = _aggregate(scores)[2]
        for district in DISTRICTS:
            district_id = district["id"]
            focus = 1 if district_id == choice["district"] else 0.18
            need = 1 + (100 - district["scores"][category_id]) / 250
            scores[district_id][category_id] = min(100, scores[district_id][category_id] + action["impact"] * focus * need)
            for cross_category, effect in action["cross"].items():
                scores[district_id][cross_category] = min(100, scores[district_id][cross_category] + effect * focus)
        after = _aggregate(scores)[2]
        contributions.append({"category": category_id, "action": action["id"], "district": choice["district"], "cost": action["cost"], "score_gain": _round(after - before)})

    city, district_averages, score = _aggregate(scores)
    spent = sum(item["cost"] for item in contributions)
    result = {
        "budget": BUDGET,
        "spent": spent,
        "remaining": BUDGET - spent,
        "decisions": len(choices),
        "complete": len(choices) == 5,
        "baseline_score": _round(base_score),
        "score": _round(score),
        "gain": _round(score - base_score),
        "city": {key: {"before": _round(base_city[key]), "after": _round(city[key]), "delta": _round(city[key] - base_city[key])} for key in CATEGORY_IDS},
        "districts": [
            {"id": district["id"], "name": district["name"], "before": _round(base_district[district["id"]]), "after": _round(district_averages[district["id"]]), "delta": _round(district_averages[district["id"]] - base_district[district["id"]]), "scores": {key: _round(scores[district["id"]][key]) for key in CATEGORY_IDS}}
            for district in DISTRICTS
        ],
        "contributions": contributions,
    }
    if result["complete"]:
        result["analysis"] = explain(result)
        if with_recommendation:
            result["recommendation"] = recommend(choices, result)
    return result


def explain(result):
    city_changes = sorted(result["city"].items(), key=lambda item: item[1]["delta"], reverse=True)
    category_names = {category["id"]: category["name"].lower() for category in CATEGORIES}
    weakest = min(result["districts"], key=lambda item: item["after"])
    strongest = city_changes[0]
    lowest = min(result["city"].items(), key=lambda item: item[1]["after"])
    leading = max(result["contributions"], key=lambda item: item["score_gain"])
    leading_action = ACTION_BY_ID[leading["action"]]
    leading_district = DISTRICT_BY_ID[leading["district"]]
    strengths = [
        f"Наибольший рост даёт направление «{category_names[strongest[0]]}»: +{strongest[1]['delta']} пункта по городу.",
        f"Самый заметный вклад в общий балл: «{leading_action['name']}» в районе {leading_district['name']} (+{leading['score_gain']}).",
    ]
    risks = [
        f"Район {weakest['name']} остаётся самым уязвимым: {weakest['after']} из 100. Его показатель ограничивает общий балл через коэффициент равенства.",
        f"Слабейшее городское направление после решений — {category_names[lowest[0]]}: {lowest[1]['after']} из 100.",
    ]
    if result["remaining"] < 100:
        risks.append("Резерв бюджета меньше 100 млн ₸; на незапланированные потребности остаётся мало средств.")
    else:
        risks.append(f"В резерве {result['remaining']} млн ₸. Это снижает финансовый риск, но оставляет часть возможного эффекта нереализованной.")
    return {
        "summary": f"Пять решений повышают Astana Quality of Life Score с {result['baseline_score']} до {result['score']} (+{result['gain']}). Потрачено {result['spent']} из {BUDGET} млн ₸.",
        "strengths": strengths,
        "risks": risks,
        "consequence": f"Главный компромисс: вложения улучшают выбранные районы, но {weakest['name'].lower()} по-прежнему задаёт нижнюю границу качества жизни. Модель учитывает эффект для соседних районов, однако он значительно слабее прямого воздействия.",
    }


def recommend(choices, current):
    """One-step local search over action and district substitutions.

    The score is an objective; no language model is allowed to alter it.
    """
    best = None
    current_score = current["score"]
    for category_id in CATEGORY_IDS:
        for action in ACTIONS:
            if action["category"] != category_id:
                continue
            for district in DISTRICTS:
                candidate = deepcopy(choices)
                candidate[category_id] = {"action": action["id"], "district": district["id"]}
                if candidate == choices:
                    continue
                try:
                    outcome = simulate(candidate)
                except ValueError:
                    continue
                improvement = round(outcome["score"] - current_score, 1)
                if improvement <= 0:
                    continue
                if best is None or (improvement, outcome["remaining"]) > (best["improvement"], best["remaining"]):
                    best = {"category": category_id, "action": action["id"], "district": district["id"], "score": outcome["score"], "improvement": improvement, "remaining": outcome["remaining"]}
    if best:
        best["text"] = f"Замените решение «{next(item['name'] for item in ACTIONS if item['id'] == choices[best['category']]['action'])}» на «{ACTION_BY_ID[best['action']]['name']}» в районе {DISTRICT_BY_ID[best['district']]['name']}. Прогноз: {best['score']} балла (+{best['improvement']}) при остатке {best['remaining']} млн ₸."
    return best
