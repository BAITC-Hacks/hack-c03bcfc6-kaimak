"""Deterministic implementation of the supplied district dataset and rules."""
from collections import Counter
from copy import deepcopy
from data import ACTIONS, BUDGET, DISTRICTS, INDICATORS, HORIZON, SYNERGIES, CONFLICTS

ACTION_BY_ID = {item['id']: item for item in ACTIONS}
DISTRICT_BY_ID = {item['id']: item for item in DISTRICTS}
WEIGHTS = {item['id']: item['weight'] for item in INDICATORS}


def validate_choices(raw, complete=False):
    if not isinstance(raw, list):
        raise ValueError('Решения должны быть списком мероприятий.')
    if len(raw) > 5 or (complete and len(raw) != 5):
        raise ValueError('Для итогового Score нужно ровно 5 решений.')
    choices, seen, counts = [], set(), Counter()
    for choice in raw:
        if not isinstance(choice, dict) or not isinstance(choice.get('action'), str):
            raise ValueError('Укажите ID мероприятия.')
        action = ACTION_BY_ID.get(choice['action'])
        if action is None:
            raise ValueError('Неизвестное мероприятие.')
        if action['id'] in seen:
            raise ValueError(f"{action['id']}: повторы мероприятий запрещены.")
        seen.add(action['id'])
        expected = {'action', 'district'} if action['scope'] == 'district' else {'action'}
        if set(choice) != expected:
            raise ValueError('Для районной меры нужен район; для городской район не указывается.')
        if action['scope'] == 'district' and (not isinstance(choice['district'], str) or choice['district'] not in DISTRICT_BY_ID):
            raise ValueError('Неизвестный район.')
        counts[action['category']] += 1
        if counts[action['category']] > 2:
            raise ValueError('Разрешено не более 2 мер из одного направления.')
        choices.append(dict(choice))
    by_id = {c['action']: c for c in choices}
    for conflict in CONFLICTS:
        a, b = conflict['pair']
        if a in by_id and b in by_id and (conflict['scope'] == 'any' or by_id[a]['district'] == by_id[b]['district']):
            raise ValueError(conflict['reason'])
    spent = sum(ACTION_BY_ID[c['action']]['cost'] for c in choices)
    if spent > BUDGET:
        raise ValueError(f'Бюджет превышен на {spent - BUDGET} усл. ед.')
    # Canonical order keeps output independent of the order of selection.
    return sorted(choices, key=lambda c: int(c['action'][1:]))


def _aggregate(scores):
    district = {d['id']: sum(scores[d['id']][k] * w for k, w in WEIGHTS.items()) for d in DISTRICTS}
    average = sum(d['population_share'] * district[d['id']] for d in DISTRICTS)
    critical = [{'district': d['id'], 'indicator': k, 'value': round(v, 3)}
                for d in DISTRICTS for k, v in scores[d['id']].items() if v < 40]
    score = .7 * average + .3 * min(district.values()) - len(critical)
    city = {k: sum(d['population_share'] * scores[d['id']][k] for d in DISTRICTS) for k in WEIGHTS}
    return district, average, critical, score, city


def simulate(raw_choices, with_recommendation=False):
    choices = validate_choices(raw_choices)
    baseline = {d['id']: dict(d['scores']) for d in DISTRICTS}
    scores = deepcopy(baseline)
    contributions, synergies = [], []
    selected = {c['action']: c for c in choices}
    for choice in choices:
        action = ACTION_BY_ID[choice['action']]
        targets = list(scores) if action['scope'] == 'city' else [choice['district']]
        fraction = (HORIZON - action['lag']) / HORIZON
        effects = {k: v * fraction for k, v in action['effects'].items()}
        for district in targets:
            for k, v in effects.items():
                scores[district][k] += v
        contributions.append({'action': action['id'], 'name': action['name'], 'category': action['category'],
                              'district': choice.get('district'), 'targets': targets, 'cost': action['cost'],
                              'lag': action['lag'], 'realized_fraction': fraction, 'effects': effects})
    for rule in SYNERGIES:
        first, second = rule['pair']
        if first in selected and second in selected:
            district = selected[first]['district']
            for k, v in rule['effects'].items():
                scores[district][k] += v
            synergies.append({**rule, 'district': district})
    # Sum all effects and fixed bonuses before clipping, as in the source formula.
    scores = {d: {k: min(100, max(0, v)) for k, v in row.items()} for d, row in scores.items()}
    base_d, base_avg, base_critical, base_score, base_city = _aggregate(baseline)
    district, average, critical, score, city = _aggregate(scores)
    spent = sum(c['cost'] for c in contributions)
    complete = len(choices) == 5
    result = {
        'choices': choices, 'budget': BUDGET, 'spent': spent, 'remaining': BUDGET - spent,
        'decisions': len(choices), 'complete': complete, 'score': round(score, 2) if complete else None,
        'projected_score': round(score, 2), 'baseline_score': round(base_score, 2), 'gain': round(score - base_score, 2),
        'formula': {'city_average': round(average, 4), 'weakest_district': round(min(district.values()), 4),
                    'critical_count': len(critical), 'baseline_critical_count': len(base_critical)},
        'critical': critical, 'synergies': synergies, 'contributions': contributions,
        'city': {k: {'before': round(base_city[k], 3), 'after': round(city[k], 3), 'delta': round(city[k]-base_city[k], 3)} for k in WEIGHTS},
        'districts': [{'id': d['id'], 'name': d['name'], 'before': round(base_d[d['id']], 2),
                       'after': round(district[d['id']], 2), 'delta': round(district[d['id']]-base_d[d['id']], 2),
                       'baseline_scores': baseline[d['id']], 'scores': scores[d['id']]} for d in DISTRICTS],
    }
    if complete:
        result['analysis'] = explain(result)
        if with_recommendation:
            result['recommendation'] = recommend(choices, result)
    return result


def explain(result):
    weakest = min(result['districts'], key=lambda d: d['after'])
    largest = max(result['districts'], key=lambda d: d['delta'])
    strengths = [f"Наибольший рост индекса района: {largest['name']} +{largest['delta']:.2f}.",
                 f"Критических показателей: {result['formula']['critical_count']} (на старте — 2)."]
    if result['synergies']:
        strengths.append('Сработали синергии: ' + ', '.join(' + '.join(s['pair']) for s in result['synergies']) + '.')
    risks = [f"Самый слабый район — {weakest['name']}: {weakest['after']:.2f}. Он определяет 30% результата.",
             f"Остаток {result['remaining']} усл. ед. сохраняется, но не приносит бонус к Score."]
    for c in result['contributions']:
        negative = {k: v for k, v in c['effects'].items() if v < 0}
        if negative:
            risks.append(f"{c['action']}: компромисс — " + ', '.join(f'{k} {v:+g}' for k, v in negative.items()) + '.')
    return {
        'summary': f"Пять решений: {result['score']:.2f} балла ({result['gain']:+.2f} к базе). Бюджет — {result['spent']} из {BUDGET} усл. ед.",
        'strengths': strengths, 'risks': risks,
        'consequence': 'Эффект рассчитан на 8 кварталов с учётом задержки каждой меры. Городские меры действуют во всех районах, районные — только в выбранном. Значение ниже 40 стоит городу одного балла за каждую пару «район × показатель».',
    }


def recommend(choices, current):
    """Try every valid single replacement; this is local search, not a global optimum."""
    best = None
    for index, old in enumerate(choices):
        for action in ACTIONS:
            targets = [None] if action['scope'] == 'city' else list(DISTRICT_BY_ID)
            for target in targets:
                replacement = {'action': action['id']}
                if target is not None:
                    replacement['district'] = target
                if replacement == old:
                    continue
                candidate = deepcopy(choices)
                candidate[index] = replacement
                try:
                    result = simulate(candidate)
                except ValueError:
                    continue
                improvement = round(result['score'] - current['score'], 2)
                if improvement > 0 and (best is None or (result['score'], result['remaining']) > (best['score'], best['remaining'])):
                    location = DISTRICT_BY_ID[target]['name'] if target else 'весь город'
                    best = {'choices': result['choices'], 'score': result['score'], 'improvement': improvement,
                            'remaining': result['remaining'],
                            'text': f"Замените {old['action']} на {action['id']} «{action['name']}» ({location}). Score {result['score']:.2f} ({improvement:+.2f}), остаток {result['remaining']} усл. ед."}
    return best
