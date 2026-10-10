import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowUpRight, ReceiptText, SlidersHorizontal } from "lucide-react";
import { useDemo } from "../../app/context";
import { type Purchase } from "../../app/demo";
import { copy as c, interpolate as f } from "../../lib/i18n";
import { rupees, dateLabel } from "../../lib/format";
import { Button, Empty, PageHeading } from "../../components/ui";
export default function History() {
  const { state } = useDemo();
  const navigate = useNavigate();
  const [store, setStore] = useState("all");
  const [limit, setLimit] = useState(30);
  const sentinel = useRef<HTMLDivElement>(null);
  const filtered = state.purchases
    .filter((p) => store === "all" || p.store === store)
    .sort((a, b) => b.date.localeCompare(a.date));
  const groups = filtered
    .slice(0, limit)
    .reduce<Record<string, Purchase[]>>((acc, p) => {
      (acc[p.date] ??= []).push(p);
      return acc;
    }, {});
  useEffect(() => {
    const node = sentinel.current;
    if (!node || limit >= filtered.length) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) setLimit((n) => n + 30);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [limit, filtered.length]);
  return (
    <div className="page">
      <PageHeading title={c.history.title} subtitle={c.history.subtitle} />
      <div className="history-summary">
        <div>
          <span>{c.history.total}</span>
          <strong>
            {rupees(filtered.reduce((sum, p) => sum + (p.price ?? 0), 0))}
          </strong>
        </div>
        <div>
          <span>{c.history.purchases}</span>
          <strong>{filtered.length}</strong>
        </div>
      </div>
      <label className="filter-label">
        <SlidersHorizontal size={17} />
        <span className="sr-only">{c.history.filter}</span>
        <select
          value={store}
          onChange={(e) => {
            setStore(e.target.value);
            setLimit(30);
          }}
        >
          <option value="all">{c.history.allStores}</option>
          {[...new Set(state.purchases.map((p) => p.store))].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      {!filtered.length ? (
        <Empty
          title={
            state.purchases.length ? c.history.noResults : c.history.emptyTitle
          }
          description={c.history.emptyCopy}
          action={c.home.addBill}
          onAction={() => navigate("/add")}
        />
      ) : (
        Object.entries(groups).map(([date, purchases]) => (
          <section className="history-group" key={date}>
            <div className="history-date">
              <h2>{dateLabel(date)}</h2>
              <span>{f(c.history.items, { count: purchases.length })}</span>
            </div>
            <div className="card">
              {purchases.map((p) => (
                <Link
                  to={`/items/${p.productId}`}
                  key={p.id}
                  className="history-row"
                >
                  <span className="history-icon">
                    <ReceiptText size={20} />
                  </span>
                  <div>
                    <h3>{p.name}</h3>
                    <p>
                      {p.store}
                      <span>·</span>
                      {p.quantity} <span>·</span>
                      {p.source === "tick"
                        ? c.history.sourceTick
                        : p.source === "sample"
                          ? c.history.demoPurchase
                          : c.history.sourceManual}
                    </p>
                  </div>
                  <strong>{p.price === null ? "—" : rupees(p.price)}</strong>
                  <ArrowUpRight size={14} />
                </Link>
              ))}
            </div>
          </section>
        ))
      )}
      {limit < filtered.length && (
        <div ref={sentinel}>
          <Button
            variant="secondary"
            className="full-width"
            onClick={() => setLimit((n) => n + 30)}
          >
            {c.history.loadMore}
          </Button>
        </div>
      )}
    </div>
  );
}
