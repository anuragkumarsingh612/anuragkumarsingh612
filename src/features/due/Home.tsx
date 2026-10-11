import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  ArrowUpRight,
  ArrowRight,
  Check,
  Clock3,
  X,
  Sparkles,
  Lightbulb,
  ScanLine,
  ShieldCheck,
  Package,
  CalendarDays,
  SlidersHorizontal,
  ChevronRight,
  Leaf,
} from "lucide-react";
import { useDemo } from "../../app/context";
import { isDue, type Product } from "../../app/demo";
import { dayDistance, daysAgo, today } from "../../lib/format";
import { ProductArt } from "../../components/Artwork";
import { Empty } from "../../components/ui";
import { cycleForProduct } from "../../lib/cycles";
import { savePurchase, updateProduct } from "../../lib/supabase";
export default function Home({ pantry = false }: { pantry?: boolean }) {
  const { state, setState, notify } = useDemo();
  const [tab, setTab] = useState<"due" | "upcoming" | "all">(
    pantry ? "all" : "due",
  );
  useEffect(() => {
    setTab(pantry ? "all" : "due");
    setFilter("all");
  }, [pantry]);
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState<string | null>(null);
  const products = state.products.map((p) =>
    cycleForProduct(p, state.purchases),
  );
  const due = products.filter(isDue);
  const upcoming = products.filter((p) => !p.ignored && !isDue(p));
  const visible = (
    tab === "due" ? due : tab === "upcoming" ? upcoming : products
  ).filter((p) => filter === "all" || p.category === filter);
  async function action(product: Product, kind: "bought" | "snoozed" | "skip") {
    setBusy(product.id);
    try {
      if (kind === "bought")
        await savePurchase({
          store: product.store,
          date: today(),
          items: [
            { name: product.name, quantity: 1, price: null, confidence: 1 },
          ],
        });
      else
        await updateProduct(product.id, {
          snooze_until: daysAgo(
            kind === "snoozed" ? -3 : -Math.ceil(product.gap / 2),
          ),
        });
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
                    kind === "snoozed" ? -3 : -Math.ceil(p.gap / 2),
                  ),
                  skips: p.skips + 1,
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
        kind === "bought"
          ? `${product.name} is restocked. One less thing to think about.`
          : kind === "snoozed"
            ? "Reminder moved to 3 days from now."
            : "Skipped for this cycle.",
      );
    } catch (e) {
      notify(
        e instanceof Error ? e.message : "Could not save. Please try again.",
      );
    } finally {
      setBusy(null);
    }
  }
  return (
    <div className="page dashboard-page">
      <div className="welcome-row">
        <div>
          <div className="day-kicker">
            <span className="tiny-dot" /> YOUR HOME, ONE STEP AHEAD
          </div>
          <h1>
            {pantry ? "Your everyday essentials." : "Good to have you home."}
            <span className="greeting-sun">✳</span>
          </h1>
          <p>
            {pantry
              ? "A little overview of everything that keeps your home running."
              : "Less remembering. More living. We’ve got your essentials covered."}
          </p>
        </div>
        <Link to="/add" className="button button-primary top-add">
          <Plus size={17} /> Add Photo
        </Link>
      </div>
      {!pantry && (
        <section className="pantry-hero">
          <div className="hero-photo" />
          <div className="hero-shade" />
          <div className="hero-copy">
            <div className="hero-label">
              <Sparkles size={13} /> A LITTLE FORESIGHT GOES A LONG WAY
            </div>
            <h2>
              A full pantry.
              <br />
              <span>A lighter mind.</span>
            </h2>
            <p>
              Your everyday essentials, restocked at the right time.
              <br className="desktop-break" /> Just add a bill. We’ll connect
              the dots.
            </p>
            <Link to="/add" className="hero-cta">
              <ScanLine size={17} /> Scan your grocery bill{" "}
              <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="hero-photo-label">
            <span className="tiny-dot" /> Small habits. Happier homes.
          </div>
        </section>
      )}
      <section className="overview-stats">
        <div>
          <span className="stat-icon lavender-icon">
            <Package size={20} />
          </span>
          <div>
            <span>On your radar</span>
            <strong>
              {String(due.length).padStart(2, "0")}
              <small>essentials due</small>
            </strong>
          </div>
          <span className="stat-pill">Let’s restock</span>
        </div>
        <div>
          <span className="stat-icon green-icon">
            <Leaf size={20} />
          </span>
          <div>
            <span>A well-kept pantry</span>
            <strong>
              {String(products.length).padStart(2, "0")}
              <small>items tracked</small>
            </strong>
          </div>
        </div>
        <div>
          <span className="stat-icon amber-icon">
            <CalendarDays size={20} />
          </span>
          <div>
            <span>Getting to know you</span>
            <strong>
              {new Set(state.purchases.map((p) => p.date)).size}
              <small>shopping days logged</small>
            </strong>
          </div>
        </div>
      </section>
      <section className="due-section">
        <div className="due-heading">
          <div>
            <h2>
              {pantry ? "My Pantry" : "Due for a little restock"}{" "}
              <span className="count-badge">{due.length}</span>
            </h2>
            <p>A gentle nudge, based on your household’s rhythm.</p>
          </div>
          <span className="prediction-label">
            <Sparkles size={13} /> Smart predictions
          </span>
        </div>
        <div className="filter-row">
          <div className="dashboard-tabs">
            {(["due", "upcoming", "all"] as const).map((t) => (
              <button
                key={t}
                aria-pressed={tab === t}
                onClick={() => setTab(t)}
                className={tab === t ? "selected" : ""}
              >
                {t === "due"
                  ? "Due now"
                  : t === "upcoming"
                    ? "Coming up"
                    : "All items"}
                <span>
                  {t === "due"
                    ? due.length
                    : t === "upcoming"
                      ? upcoming.length
                      : products.length}
                </span>
              </button>
            ))}
          </div>
          <label className="category-filter">
            <SlidersHorizontal size={15} />
            <select
              aria-label="Filter category"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All categories</option>
              <option value="pantry">Pantry staples</option>
              <option value="dairy">Dairy</option>
              <option value="home">Home care</option>
              <option value="personal">Personal care</option>
            </select>
          </label>
        </div>
        <div className="restock-grid">
          {visible.map((product) => {
            const remaining = Math.max(
              5,
              Math.min(
                100,
                100 - (dayDistance(product.last) / product.gap) * 100,
              ),
            );
            const overdue = dayDistance(product.last) >= product.gap;
            return (
              <article className="restock-card" key={product.id}>
                <div className="restock-card-top">
                  <span className="category-tag">
                    {product.category === "pantry"
                      ? "Pantry staples"
                      : product.category === "dairy"
                        ? "Dairy & everyday"
                        : product.category === "home"
                          ? "Home care"
                          : "Personal care"}
                  </span>
                  <span className={`estimate-tag ${overdue ? "urgent" : ""}`}>
                    <span />
                    {product.learning
                      ? "Learning"
                      : overdue
                        ? "Running low"
                        : "Due soon"}
                  </span>
                </div>
                <Link to={`/items/${product.id}`} className="restock-product">
                  <div className={`product-picture picture-${product.art}`}>
                    <ProductArt kind={product.art} />
                  </div>
                  <div>
                    <h3>{product.name}</h3>
                    <p>
                      {product.pack} <span>·</span> {product.store}
                    </p>
                    <small>
                      Last bought {dayDistance(product.last)} days ago
                    </small>
                  </div>
                </Link>
                <div className="stock-meta">
                  <span>
                    {product.learning
                      ? "Learning your routine"
                      : overdue
                        ? "Time to top up"
                        : `About ${Math.max(1, Math.round(product.gap - dayDistance(product.last)))} days left`}
                  </span>
                  <span>
                    {product.learning
                      ? "New item"
                      : `${Math.round(product.confidence * 100)}% confidence`}
                  </span>
                </div>
                <div className={`stock-track ${overdue ? "low" : ""}`}>
                  <span style={{ width: `${remaining}%` }} />
                </div>
                <div className="restock-actions">
                  <button
                    className="bought-action"
                    disabled={busy === product.id}
                    onClick={() => void action(product, "bought")}
                  >
                    <Check size={16} /> Bought
                  </button>
                  <button
                    disabled={busy === product.id}
                    onClick={() => void action(product, "snoozed")}
                  >
                    <Clock3 size={14} /> +3 days
                  </button>
                  <button
                    disabled={busy === product.id}
                    aria-label={`Skip ${product.name}`}
                    onClick={() => void action(product, "skip")}
                  >
                    <X size={15} /> Skip
                  </button>
                </div>
              </article>
            );
          })}
        </div>
        {!visible.length && (
          <Empty
            title="A little breathing room."
            description="Nothing due here. Your pantry is in a good place."
          />
        )}
      </section>
      <div className="dashboard-bottom">
        <Link to="/add" className="scan-callout">
          <span className="scan-callout-icon">
            <ScanLine size={25} />
          </span>
          <div>
            <h3>Paper bill? Meet a smarter pantry.</h3>
            <p>One photo. Every essential accounted for.</p>
          </div>
          <span className="scan-callout-link">
            Scan a bill <ArrowRight size={16} />
          </span>
        </Link>
        <div className="insight-callout">
          <span className="insight-label">
            <Lightbulb size={15} /> THE LITTLE THINGS
          </span>
          <p>
            The more you add, the better we learn.
            <br />
            Your pantry gets smarter with every shop.
          </p>
          <Link to="/history">
            Your shopping rhythm <ChevronRight size={15} />
          </Link>
        </div>
      </div>
      <div className="home-reassurance">
        <ShieldCheck size={14} /> Your pantry, your privacy. Always.
      </div>
    </div>
  );
}
