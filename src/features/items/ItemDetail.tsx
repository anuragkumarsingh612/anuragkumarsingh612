import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { z } from "zod";
import { Clock3, Check } from "lucide-react";
import { useDemo } from "../../app/context";
import { copy as c, interpolate as f } from "../../lib/i18n";
import { dateLabel, rupees } from "../../lib/format";
import { ProductArt } from "../../components/Artwork";
import { updateProduct } from "../../lib/supabase";
import { cycleForProduct } from "../../lib/cycles";
import { Button, Empty, PageHeading, Card } from "../../components/ui";
export default function ItemDetail() {
  const { id } = useParams();
  const { state, setState, notify } = useDemo();
  const storedProduct = state.products.find((p) => p.id === id);
  const product = storedProduct
    ? cycleForProduct(storedProduct, state.purchases)
    : undefined;
  const [gap, setGap] = useState(String(product?.gap ?? 30));
  const [ignored, setIgnored] = useState(product?.ignored ?? false);
  const [error, setError] = useState("");
  if (!product)
    return (
      <div className="page">
        <Empty title={c.item.notFound} />
        <Link to="/">{c.common.home}</Link>
      </div>
    );
  const purchases = state.purchases
    .filter((p) => p.productId === id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const prices = purchases
    .filter((p) => p.price !== null)
    .reverse()
    .map((p) => p.price as number);
  const min = Math.min(...prices),
    max = Math.max(...prices);
  const points = prices
    .map(
      (p, i) =>
        `${16 + (i / Math.max(1, prices.length - 1)) * 288},${68 - ((p - min) / Math.max(1, max - min)) * 44}`,
    )
    .join(" ");
  return (
    <div className="page">
      <PageHeading title={c.item.title} back />
      <div className="item-hero">
        <ProductArt kind={product.art} />
        <h1>{product.name}</h1>
        <p>{product.pack}</p>
      </div>
      <Card className="chart-card">
        <h2>{c.item.priceTrend}</h2>
        {prices.length ? (
          <>
            <svg
              viewBox="0 0 320 85"
              role="img"
              aria-label={f(c.item.priceAccessible, {
                prices: prices.map(rupees).join(", "),
              })}
            >
              <path
                d="M16 70H304M16 40H304M16 12H304"
                stroke="#2c2c31"
                strokeDasharray="3 4"
              />
              <polyline
                fill="none"
                stroke="#8ab4ff"
                strokeWidth="2"
                points={points}
              />
              {points.split(" ").map((point, i) => (
                <circle
                  key={i}
                  cx={point.split(",")[0]}
                  cy={point.split(",")[1]}
                  r="3.5"
                  fill="#8ab4ff"
                />
              ))}
            </svg>
            <div className="chart-labels">
              <span>{rupees(prices[0])}</span>
              <span>{rupees(prices[prices.length - 1])}</span>
            </div>
          </>
        ) : (
          <p>{c.item.noPrices}</p>
        )}
      </Card>
      <form
        className="card preferences-card"
        onSubmit={async (event) => {
          event.preventDefault();
          const result = z.coerce.number().int().min(1).max(365).safeParse(gap);
          if (!result.success) {
            setError(c.item.invalidDays);
            return;
          }
          try {
            await updateProduct(product.id, {
              manual_cycle_days: result.data,
              ignored,
            });
          } catch (e) {
            setError(e instanceof Error ? e.message : "Could not save.");
            return;
          }
          setState((s) => ({
            ...s,
            products: s.products.map((p) =>
              p.id === id
                ? {
                    ...p,
                    gap: result.data,
                    overrideGap: result.data,
                    ignored,
                    learning: false,
                  }
                : p,
            ),
          }));
          setError("");
          notify(c.item.saved);
        }}
      >
        <div className="icon-heading">
          <Clock3 size={18} />
          <h2>{c.item.cycle}</h2>
        </div>
        <p>{product.learning ? c.item.learning : c.item.cycleCopy}</p>
        <label>
          {c.item.days}
          <input
            type="number"
            min="1"
            max="365"
            value={gap}
            onChange={(e) => setGap(e.target.value)}
          />
        </label>
        {error && (
          <p role="alert" className="field-error">
            {error}
          </p>
        )}
        <label className="toggle-label">
          <span>
            <strong>{c.item.ignore}</strong>
            <small>{c.item.ignoreCopy}</small>
          </span>
          <input
            type="checkbox"
            className="toggle"
            checked={ignored}
            onChange={(e) => setIgnored(e.target.checked)}
          />
        </label>
        <Button type="submit" className="full-width">
          <Check size={17} />
          {c.common.save}
        </Button>
      </form>
      <h2 className="subheading">{c.item.history}</h2>
      <Card>
        {purchases.map((p) => (
          <div className="item-purchase" key={p.id}>
            <div>
              <strong>{dateLabel(p.date)}</strong>
              <span>{p.store}</span>
            </div>
            <strong>{p.price === null ? "—" : rupees(p.price)}</strong>
          </div>
        ))}
      </Card>
    </div>
  );
}
