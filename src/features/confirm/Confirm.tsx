import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Check, Plus, Trash2, Info } from "lucide-react";
import { useDemo } from "../../app/context";
import { STORES, type Product, type Purchase } from "../../app/demo";
import { confirmationSchema, type Confirmation } from "../../lib/schemas";
import { copy as c, interpolate as f } from "../../lib/i18n";
import { today, rupees } from "../../lib/format";
import { Button, PageHeading } from "../../components/ui";
import { useState } from "react";
import { savePurchase, supabase } from "../../lib/supabase";
import { purchaseRowSchema } from "../../lib/schemas";
import { z } from "zod";
import { InstallPrompt } from "../settings/InstallPrompt";
export default function Confirm() {
  const [params] = useSearchParams();
  const sample = params.get("sample") === "1";
  const location = useLocation();
  const parsed = z
    .object({
      store: z.string().nullable(),
      items: z.array(purchaseRowSchema).min(1).max(100),
    })
    .safeParse(location.state?.receipt);
  const receipt = parsed.success ? parsed.data : null;
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);
  const { setState, notify } = useDemo();
  const navigate = useNavigate();
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Confirmation>({
    resolver: zodResolver(confirmationSchema),
    defaultValues: {
      store: receipt?.store || (sample ? "D-Mart" : STORES[0]),
      date: today(),
      items:
        receipt?.items ??
        (sample
          ? [
              {
                name: "Aashirvaad Shudh Chakki Atta",
                quantity: 1,
                price: 245,
                confidence: 0.96,
              },
              { name: "Tata Salt", quantity: 1, price: 28, confidence: 0.95 },
              {
                name: "MTR Garam Masala 100g",
                quantity: 1,
                price: 72,
                confidence: 0.52,
              },
              {
                name: "Fortune Sunlite Oil",
                quantity: 2,
                price: 278,
                confidence: 0.98,
              },
            ]
          : [{ name: "", quantity: 1, price: null, confidence: 1 }]),
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const items = watch("items");
  async function save(data: Confirmation) {
    setSaveError("");
    let remote: Array<{ id: string; name: string }> | null;
    try {
      remote = await savePurchase(data);
    } catch (e) {
      setSaveError(
        e instanceof Error ? e.message : "Could not save. Please try again.",
      );
      return;
    }
    setState((s) => {
      const products = [...s.products];
      const purchases: Purchase[] = [];
      for (const row of data.items) {
        let product = products.find(
          (p) => p.name.toLocaleLowerCase() === row.name.toLocaleLowerCase(),
        );
        if (!product) {
          product = {
            id:
              remote?.find(
                (p) => p.name.toLowerCase() === row.name.toLowerCase(),
              )?.id ?? crypto.randomUUID(),
            name: row.name,
            pack: "",
            category: "pantry",
            art: "lentils",
            gap: 30,
            confidence: 0,
            last: data.date,
            store: data.store,
            price: row.price,
            ignored: false,
            snoozeUntil: null,
            skips: 0,
            learning: true,
          } satisfies Product;
          products.push(product);
        } else if (data.date >= product.last) {
          products[products.indexOf(product)] = {
            ...product,
            last: data.date,
            store: data.store,
            price: row.price,
            snoozeUntil: null,
            skips: 0,
          };
        }
        purchases.push({
          id: crypto.randomUUID(),
          productId: product.id,
          name: row.name,
          store: data.store,
          date: data.date,
          quantity: row.quantity,
          price: row.price,
          source: sample ? "sample" : "manual",
        });
      }
      return {
        ...s,
        products,
        purchases: [...purchases, ...s.purchases],
        savedOnce: true,
      };
    });
    notify(c.confirm.saved);
    setSaved(true);
  }
  if (saved)
    return (
      <div className="page success-page">
        <div className="success-icon">
          <Check size={34} />
        </div>
        <h1>{c.confirm.saved}</h1>
        <p>
          {supabase
            ? "Your household pantry is up to date."
            : "Saved to your pantry on this device."}
        </p>
        <Button onClick={() => navigate("/history")}>{c.common.history}</Button>
        <InstallPrompt />
        <Button variant="ghost" onClick={() => navigate("/")}>
          {c.common.home}
        </Button>
      </div>
    );
  return (
    <div className="page">
      <PageHeading
        title={receipt || sample ? "Receipt, meet pantry." : c.confirm.title}
        subtitle="A quick once-over, then you’re all stocked up."
        back
      />
      <div className="info-banner">
        <Info size={17} />
        {receipt
          ? "AI has read your photo. Check the names, quantities and prices before saving."
          : sample
            ? "Example receipt · Try editing an item to make it your own."
            : c.confirm.manualNotice}
      </div>
      {saveError && (
        <div className="error-banner" role="alert">
          {saveError}
        </div>
      )}
      <form onSubmit={handleSubmit(save)}>
        <div className="form-grid">
          <label>
            {c.common.store}
            <input list="stores" {...register("store")} />
            <datalist id="stores">
              {STORES.map((store) => (
                <option key={store}>{store}</option>
              ))}
            </datalist>
            {errors.store && (
              <span className="field-error">{errors.store.message}</span>
            )}
          </label>
          <label>
            {c.common.date}
            <input type="date" max={today()} {...register("date")} />
            {errors.date && (
              <span className="field-error">{errors.date.message}</span>
            )}
          </label>
        </div>
        <div className="confirm-rows">
          {fields.map((field, i) => (
            <fieldset className="card confirm-row" key={field.id}>
              <legend className="sr-only">
                {f(c.confirm.itemNumber, { number: i + 1 })}
              </legend>
              <div className="row-top">
                <span className="eyebrow">
                  {f(c.confirm.itemNumber, { number: i + 1 })}
                </span>
                <span className="receipt-match">
                  {Math.round(field.confidence * 100)}% match
                </span>
                {field.confidence < 0.7 && (
                  <span className="check-tag">{c.confirm.check}</span>
                )}
                <button
                  type="button"
                  className="icon-button"
                  aria-label={f(c.confirm.removeItem, { number: i + 1 })}
                  onClick={() => remove(i)}
                >
                  <Trash2 size={17} />
                </button>
              </div>
              <label>
                {c.common.name}
                <input
                  {...register(`items.${i}.name`)}
                  aria-invalid={!!errors.items?.[i]?.name}
                />
                {errors.items?.[i]?.name && (
                  <span className="field-error">
                    {errors.items[i]?.name?.message}
                  </span>
                )}
              </label>
              <div className="form-grid">
                <label>
                  {c.common.quantity}
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    {...register(`items.${i}.quantity`)}
                    aria-invalid={!!errors.items?.[i]?.quantity}
                  />
                  {errors.items?.[i]?.quantity && (
                    <span className="field-error">
                      {c.confirm.errorQuantity}
                    </span>
                  )}
                </label>
                <label>
                  {c.common.price}
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={c.common.optional}
                    {...register(`items.${i}.price`)}
                    aria-invalid={!!errors.items?.[i]?.price}
                  />
                  {errors.items?.[i]?.price && (
                    <span className="field-error">{c.confirm.errorPrice}</span>
                  )}
                </label>
              </div>
            </fieldset>
          ))}
        </div>
        {errors.items?.message && (
          <p className="field-error" role="alert">
            {errors.items.message}
          </p>
        )}
        <Button
          variant="secondary"
          type="button"
          className="full-width dashed-button"
          disabled={fields.length >= 100}
          onClick={() =>
            append({ name: "", quantity: 1, price: null, confidence: 1 })
          }
        >
          <Plus size={18} />
          {c.confirm.addRow}
        </Button>
        <div className="confirm-total">
          <span>{c.confirm.total}</span>
          <strong>
            {rupees(
              items.reduce((sum, row) => sum + (Number(row.price) || 0), 0),
            )}
          </strong>
        </div>
        <Button
          className="full-width"
          type="submit"
          disabled={isSubmitting || !fields.length}
        >
          <Check size={18} />
          {f(c.confirm.save, { count: fields.length })}
        </Button>
      </form>
    </div>
  );
}
