import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  Clock3,
  Minus,
  ShieldCheck,
  Sparkles,
  Lightbulb,
} from "lucide-react";
import { useDemo } from "../../app/context";
import { isDue, type Product } from "../../app/demo";
import { copy as c, interpolate as f } from "../../lib/i18n";
import { dayDistance, daysAgo, today } from "../../lib/format";
import { ProductArt, GroceryArt } from "../../components/Artwork";
import { Button, Empty, Sheet } from "../../components/ui";
type Tab = "due" | "upcoming" | "all";
export default function Home() {
  const { state, setState, notify } = useDemo();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("due");
  const [ignore, setIgnore] = useState<Product | null>(null);
  const due = state.products
    .filter(isDue)
    .sort(
      (a, b) =>
        (dayDistance(b.last) / b.gap) * b.confidence -
        (dayDistance(a.last) / a.gap) * a.confidence,
    )
    .slice(0, 15);
  const upcoming = state.products.filter((p) => !p.ignored && !isDue(p));
  const visible =
    tab === "due" ? due : tab === "upcoming" ? upcoming : state.products;
  function action(product: Product, kind: "bought" | "not_needed" | "snoozed") {
    setState((s) => ({
      ...s,
      products: s.products.map((p) =>
        p.id !== product.id
          ? p
          : kind === "bought"
            ? { ...p, last: today(), snoozeUntil: null, skips: 0 }
            : {
                ...p,
                snoozeUntil: daysAgo(
                  -Math.ceil(kind === "snoozed" ? 3 : p.gap / 2),
                ),
                skips: kind === "not_needed" ? p.skips + 1 : 0,
                confidence:
                  kind === "not_needed" && p.skips === 2
                    ? p.confidence * 0.7
                    : p.confidence,
              },
      ),
      purchases:
        kind === "bought"
          ? [
              {
                id: crypto.randomUUID(),
                productId: product.id,
                name: product.name,
                store: product.store,
                date: today(),
                quantity: 1,
                price: null,
                source: "tick",
              },
              ...s.purchases,
            ]
          : s.purchases,
    }));
    notify(
      f(
        kind === "bought"
          ? c.home.boughtToast
          : kind === "not_needed"
            ? c.home.notNeededToast
            : c.home.snoozedToast,
        { name: product.name },
      ),
    );
    if (kind === "not_needed" && product.skips === 2) setIgnore(product);
  }
  return (
    <div className="page home-page">
      <p className="greeting">{c.home.greeting}</p>
      <section className="hero-card">
        <div className="hero-topline">
          <span className="eyebrow">{c.home.eyebrow}</span>
          <Sparkles size={14} />
        </div>
        <div className="hero-content">
          <h1>{c.home.heroTitle}</h1>
          <p>{c.home.heroCopy}</p>
          <GroceryArt />
        </div>
        <Link to="/add" className="button button-primary hero-button">
          <span className="plus-symbol">+</span>
          {c.home.addBill}
          <ArrowUpRight size={19} />
        </Link>
      </section>
      <p className="privacy-caption">
        <ShieldCheck size={12} />
        {c.home.private}
      </p>
      <section className="stats" aria-label={c.home.trackingCount}>
        <div>
          <strong>
            {String(due.length).padStart(2, "0")}
            <span className="stat-dot" />
          </strong>
          <span>{c.home.dueCount}</span>
        </div>
        <div>
          <strong>{String(state.products.length).padStart(2, "0")}</strong>
          <span>{c.home.trackingCount}</span>
        </div>
        <div>
          <strong>
            {String(new Set(state.purchases.map((p) => p.store)).size).padStart(
              2,
              "0",
            )}
          </strong>
          <span>{c.home.storesCount}</span>
        </div>
      </section>
      <section className="restock-section">
        <div className="section-title">
          <div>
            <h2>{c.home.title}</h2>
            <p>{c.home.subtitle}</p>
          </div>
          <span className="section-icon">
            <ShoppingBagIcon />
          </span>
        </div>
        <div className="tabs" role="tablist" aria-label={c.home.title}>
          {(["due", "upcoming", "all"] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              tabIndex={tab === t ? 0 : -1}
              onKeyDown={(event) => {
                const tabs: Tab[] = ["due", "upcoming", "all"];
                const index = tabs.indexOf(t);
                const next =
                  event.key === "ArrowRight"
                    ? tabs[(index + 1) % 3]
                    : event.key === "ArrowLeft"
                      ? tabs[(index + 2) % 3]
                      : event.key === "Home"
                        ? tabs[0]
                        : event.key === "End"
                          ? tabs[2]
                          : null;
                if (next) {
                  event.preventDefault();
                  setTab(next);
                  document.getElementById(`tab-${next}`)?.focus();
                }
              }}
              id={`tab-${t}`}
              aria-controls="products-panel"
              onClick={() => setTab(t)}
              className={tab === t ? "selected" : ""}
            >
              {t === "due"
                ? c.home.dueTab
                : t === "upcoming"
                  ? c.home.upcomingTab
                  : c.home.allTab}
              <span>
                {t === "due"
                  ? due.length
                  : t === "upcoming"
                    ? upcoming.length
                    : state.products.length}
              </span>
            </button>
          ))}
        </div>
        <div
          id="products-panel"
          role="tabpanel"
          aria-labelledby={`tab-${tab}`}
          className="product-list"
        >
          {visible.length ? (
            visible.map((product) => (
              <article className="product-card" key={product.id}>
                <Link to={`/items/${product.id}`} className="product-main">
                  <ProductArt kind={product.art} />
                  <div className="product-information">
                    <div className="product-name">
                      <h3>{product.name}</h3>
                      <ArrowUpRight size={14} />
                    </div>
                    <span className="pack-size">{product.pack}</span>
                    <p>
                      {f(c.home.lastBought, {
                        days: dayDistance(product.last),
                        store: product.store,
                      })}
                    </p>
                  </div>
                </Link>
                <div className="cycle-row">
                  <span>
                    <Clock3 size={12} />
                    {product.learning
                      ? c.home.learning
                      : f(c.home.usually, { days: product.gap })}
                  </span>
                  <span
                    className={`confidence ${product.confidence >= 0.7 ? "high" : "medium"}`}
                  >
                    <span />
                    {product.confidence >= 0.7
                      ? c.home.high
                      : product.confidence >= 0.4
                        ? c.home.medium
                        : c.home.low}
                  </span>
                </div>
                {tab === "due" ? (
                  <div className="product-actions">
                    <button
                      className="bought-button"
                      aria-label={f(c.home.boughtLabel, { name: product.name })}
                      onClick={() => action(product, "bought")}
                    >
                      <Check size={15} />
                      {c.home.bought}
                    </button>
                    <button
                      aria-label={f(c.home.notNeededLabel, {
                        name: product.name,
                      })}
                      onClick={() => action(product, "not_needed")}
                    >
                      <Minus size={14} />
                      {c.home.notNeeded}
                    </button>
                    <button
                      aria-label={f(c.home.snoozeLabel, { name: product.name })}
                      onClick={() => action(product, "snoozed")}
                    >
                      <Clock3 size={14} />
                      {c.home.snooze}
                    </button>
                  </div>
                ) : (
                  <Link
                    className="item-details-link"
                    to={`/items/${product.id}`}
                  >
                    {product.learning ? c.home.learningCopy : c.item.cycle}
                    <ArrowRight size={14} />
                  </Link>
                )}
              </article>
            ))
          ) : (
            <Empty
              title={
                state.products.length ? c.home.emptyTitle : c.home.firstTitle
              }
              description={
                state.products.length
                  ? c.home.emptyDescription
                  : c.home.firstDescription
              }
              action={c.home.addBill}
              onAction={() => navigate("/add")}
            />
          )}
        </div>
      </section>
      <div className="learning-tip">
        <span>
          <Lightbulb size={18} />
        </span>
        <div>
          <h3>{c.home.tipTitle}</h3>
          <p>{c.home.tipCopy}</p>
        </div>
      </div>
      <p className="page-footnote">{c.home.footer}</p>
      {ignore && (
        <Sheet title={c.home.ignorePrompt} onClose={() => setIgnore(null)}>
          <p>{c.home.ignoreCopy}</p>
          <Button
            onClick={() => {
              setState((s) => ({
                ...s,
                products: s.products.map((p) =>
                  p.id === ignore.id ? { ...p, ignored: true } : p,
                ),
              }));
              setIgnore(null);
            }}
          >
            {c.home.ignore}
          </Button>
          <Button variant="ghost" onClick={() => setIgnore(null)}>
            {c.home.keep}
          </Button>
        </Sheet>
      )}
    </div>
  );
}
function ShoppingBagIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      aria-hidden="true"
    >
      <path d="M5 8h14l1 12H4L5 8Z" />
      <path d="M8 9V6a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
