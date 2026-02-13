import { useEffect, useMemo, useRef, useState } from "react";

const SUPPORT_USERNAME = "@youdaew";
const SUPPORT_LINK = "https://t.me/youdaew";

// Backend API URL - update this after deploying to PythonAnywhere
const API_BASE_URL = "https://NazarN1789.pythonanywhere.com";  // <-- CHANGE THIS

const FALLBACK_PLANS = [
  {
    id: "lite",
    name: "Meeedl.Pack · 1 месяц",
    period: "1 месяц",
    price: "1500 ₽",
    paymentUrl: "https://t.me/tribute",
  },
  {
    id: "plus",
    name: "Meeedl.Pack · 3 месяца",
    period: "3 месяца",
    price: "3499 ₽ (1166 ₽/мес)",
    paymentUrl: "https://t.me/tribute",
  },
  {
    id: "pro",
    name: "Meeedl.Pack · 6 месяцев",
    period: "6 месяцев",
    price: "6499 ₽ (1083 ₽/мес)",
    paymentUrl: "https://t.me/tribute",
  },
];

function getTelegramWebApp() {
  if (typeof window === "undefined") {
    return null;
  }
  return window.Telegram?.WebApp ?? null;
}

function getPlanIdFromSearch() {
  const params = new URLSearchParams(window.location.search);
  return (params.get("plan") || "").toLowerCase();
}

function normalizePlan(rawPlan) {
  return {
    id: String(rawPlan?.id || "").toLowerCase(),
    name: String(rawPlan?.name || "Тариф доступа"),
    period: String(rawPlan?.period_label || "-"),
    price: String(rawPlan?.display_price || "-"),
    paymentUrl: String(rawPlan?.payment_url || rawPlan?.paymentUrl || "").trim(),
  };
}

function openPaymentLink(url) {
  const webApp = getTelegramWebApp();
  if (webApp) {
    const isTelegramDeepLink = url.startsWith("https://t.me/") || url.startsWith("tg://");
    if (isTelegramDeepLink && typeof webApp.openTelegramLink === "function") {
      webApp.openTelegramLink(url);
      return;
    }
    if (typeof webApp.openLink === "function") {
      webApp.openLink(url);
      return;
    }
  }

  window.location.href = url;
}

function isRecommended(planId) {
  return planId === "plus";
}

function PlanCard({ plan, active, onSelect }) {
  return (
    <button type="button" className={`plan-card ${active ? "active" : ""}`} onClick={() => onSelect(plan.id)}>
      {isRecommended(plan.id) ? <span className="plan-badge">Рекомендуем</span> : null}
      <p className="plan-period">{plan.period}</p>
      <h3 className="plan-name">{plan.name}</h3>
      <p className="plan-price">{plan.price}</p>
      <span className="plan-action">Выбрать тариф</span>
    </button>
  );
}

export default function App() {
  const [queryPlanId] = useState(getPlanIdFromSearch);
  const [plans, setPlans] = useState(FALLBACK_PLANS);
  const [state, setState] = useState("loading");
  const [notice, setNotice] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(queryPlanId || "");
  const plansRef = useRef(null);

  useEffect(() => {
    const webApp = getTelegramWebApp();
    if (!webApp) {
      return;
    }
    webApp.ready();
    webApp.expand();
    webApp.setHeaderColor("#000000");
    webApp.setBackgroundColor("#000000");
    if (typeof webApp.setBottomBarColor === "function") {
      webApp.setBottomBarColor("#000000");
    }
  }, []);

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll(".reveal"));
    if (!nodes.length) {
      return;
    }

    if (typeof window.IntersectionObserver !== "function") {
      nodes.forEach((node) => node.classList.add("visible"));
      return;
    }

    const observer = new window.IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.2,
        rootMargin: "0px 0px -8% 0px",
      },
    );

    nodes.forEach((node) => observer.observe(node));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadPlans() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/plans`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.detail || "Не удалось загрузить тарифы.");
        }

        const normalized = Array.isArray(payload?.plans) ? payload.plans.map(normalizePlan) : [];
        if (!normalized.length) {
          throw new Error("Тарифы временно недоступны.");
        }

        if (!cancelled) {
          setPlans(normalized);
          setState("ready");
        }
      } catch {
        if (!cancelled) {
          setPlans(FALLBACK_PLANS);
          setState("fallback");
        }
      }
    }

    loadPlans();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!plans.length) {
      return;
    }

    const matched = plans.some((plan) => plan.id === selectedPlanId);
    if (!matched) {
      const defaultId = plans.some((plan) => plan.id === queryPlanId) ? queryPlanId : plans[0].id;
      setSelectedPlanId(defaultId);
    }
  }, [plans, selectedPlanId, queryPlanId]);

  const selectedPlan = useMemo(() => {
    if (!plans.length) {
      return null;
    }
    return plans.find((plan) => plan.id === selectedPlanId) || plans[0];
  }, [plans, selectedPlanId]);

  const handleOpenPayment = () => {
    if (!selectedPlan) {
      return;
    }
    if (!selectedPlan.paymentUrl) {
      setNotice(`Ссылка для ${selectedPlan.name} временно недоступна. Напишите ${SUPPORT_USERNAME}.`);
      return;
    }

    setIsRedirecting(true);
    setNotice("");
    try {
      openPaymentLink(selectedPlan.paymentUrl);
      setNotice("Открываем Tribute для безопасной оплаты.");
    } catch {
      setNotice("Не удалось открыть страницу оплаты. Попробуйте еще раз.");
    } finally {
      setIsRedirecting(false);
    }
  };

  const scrollToPlans = () => {
    plansRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="page">
      <div className="texture" aria-hidden="true" />

      <main className="layout">
        <section className="hero-card reveal">
          <img src="/logo.jpg" alt="Meeedl.Eng" className="brand-logo" width="88" height="88" />
          <p className="brand-kicker">MEEEDL.PACK</p>
          <h1 className="title">Английский как стиль жизни</h1>
          <p className="subtitle">Забери доступ в Meeedl.Pack и начни прокачку уже сегодня.</p>
          <button type="button" className="primary-button hero-button" onClick={scrollToPlans}>
            Выбрать тариф
          </button>
        </section>

        <section className="section-card reveal">
          <h2 className="section-title">Что внутри</h2>
          <ul className="benefits-list" aria-label="Преимущества">
            <li>350+ материалов для изучения английского языка.</li>
            <li>Приятное комьюнити, задания, практика и интересные интерактивы.</li>
            <li>Все идеально разбито по папкам, где нужное находится за секунду.</li>
          </ul>
        </section>

        <section className="section-card reveal">
          <h2 className="section-title">Почему сейчас</h2>
          <p className="helper-text">
            Начни сегодня и почувствуй первый результат уже через 7 дней.
            <br /><br />
          </p>
          <ul className="steps-list" aria-label="Что даст старт сегодня">
            <li>Быстрый вход в систему без хаоса.</li>
            <li>Регулярная практика с поддержкой комьюнити.</li>
            <li>Понятный путь от базы к уверенному английскому.</li>
          </ul>
        </section>

        <section className="section-card reveal">
          <h2 className="section-title">Как это работает</h2>
          <ol className="steps-list" aria-label="Как оформить доступ">
            <li>Выбери тариф ниже.</li>
            <li>Нажми «Перейти к оплате» и оплати в Tribute.</li>
            <li>Tribute автоматически откроет доступ к каналу.</li>
          </ol>
        </section>

        <section ref={plansRef} className="section-card reveal">
          <h2 className="section-title">Тарифы</h2>
          <div className="plans-grid">
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} active={selectedPlan?.id === plan.id} onSelect={setSelectedPlanId} />
            ))}
          </div>
          {state === "loading" ? <p className="helper-text">Загружаем варианты доступа…</p> : null}
          {state === "fallback" ? <p className="helper-text">Показываем тарифы в резервном режиме.</p> : null}
          {notice ? <p className="notice-text">{notice}</p> : null}
        </section>

        <section className="section-card reveal">
          <h2 className="section-title">Вопросы и ответы</h2>
          <details className="faq-item">
            <summary>Стоит ли оно того?</summary>
            <div className="faq-answer">
              <p>Конечно стоит: английский - это инвестирование в свое будущее.</p>
            </div>
          </details>
          <details className="faq-item">
            <summary>Когда откроется доступ?</summary>
            <div className="faq-answer">
              <p>Сразу после подтверждения оплаты в Tribute.</p>
            </div>
          </details>
          <details className="faq-item">
            <summary>Смогу ли совмещать с работой/учебой?</summary>
            <div className="faq-answer">
              <p>Да. Материалы структурированы так, чтобы заниматься короткими подходами каждый день.</p>
            </div>
          </details>
        </section>

        <section className="section-card compact reveal support-card">
          <p className="helper-text">
            По всем вопросам: <a href={SUPPORT_LINK}>{SUPPORT_USERNAME}</a>
          </p>
          <p className="helper-text">Будем рады вашему прогрессу и отзывам.</p>
        </section>
      </main>

      <aside className="sticky-bar">
        <div className="sticky-meta">
          <p className="sticky-label">Выбранный тариф</p>
          <p className="sticky-value">{selectedPlan ? selectedPlan.price : "-"}</p>
        </div>
        <div className="sticky-cta">
          <button type="button" className="primary-button sticky-button" disabled={!selectedPlan || isRedirecting} onClick={handleOpenPayment}>
            {isRedirecting ? "Открываем…" : "Перейти к оплате"}
          </button>
          <p className="sticky-note">Выбран тариф: {selectedPlan ? selectedPlan.name : "-"}</p>
        </div>
      </aside>
    </div>
  );
}
