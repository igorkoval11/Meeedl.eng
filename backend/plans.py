from dataclasses import asdict, dataclass


@dataclass(frozen=True, slots=True)
class Plan:
    id: str
    name: str
    period_label: str
    price_rub: int
    display_price: str
    description: str


PLANS: dict[str, Plan] = {
    "lite": Plan(
        id="lite",
        name="Meeedl.Pack · 1 месяц",
        period_label="1 месяц",
        price_rub=1500,
        display_price="1500 ₽",
        description="Легкий старт в Meeedl.Pack на 1 месяц.",
    ),
    "plus": Plan(
        id="plus",
        name="Meeedl.Pack · 3 месяца",
        period_label="3 месяца",
        price_rub=3499,
        display_price="3499 ₽ (1166 ₽/мес)",
        description="Уверенный прогресс в Meeedl.Pack на 3 месяца.",
    ),
    "pro": Plan(
        id="pro",
        name="Meeedl.Pack · 6 месяцев",
        period_label="6 месяцев",
        price_rub=6499,
        display_price="6499 ₽ (1083 ₽/мес)",
        description="Максимальный апгрейд в Meeedl.Pack на 6 месяцев.",
    ),
}

PLAN_ORDER: tuple[str, ...] = ("lite", "plus", "pro")


def get_plan(plan_id: str) -> Plan | None:
    normalized = (plan_id or "").strip().lower()
    return PLANS.get(normalized)


def serialize_plan(plan: Plan) -> dict[str, object]:
    return asdict(plan)


def serialize_all_plans() -> list[dict[str, object]]:
    return [serialize_plan(PLANS[plan_id]) for plan_id in PLAN_ORDER]
